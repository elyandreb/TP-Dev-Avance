import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';
import { EloCalculatorService } from './elo-calculator.service';

/**
 * Service pour gérer les joueurs en base de données.
 * Responsabilité : CRUD des joueurs et calcul du classement initial.
 */
@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly eloCalculator: EloCalculatorService,
  ) {}

  /**
   * Crée un nouveau joueur en base de données.
   * Le classement initial est calculé sur la moyenne des joueurs existants.
   *
   * @param {string} id - L'identifiant du nouveau joueur.
   * @throws {ConflictException} Si un joueur avec cet ID existe déjà.
   * @returns {Promise<Player>} Le joueur nouvellement créé.
   */
  async createPlayer(id: string): Promise<Player> {
    const existing = await this.playerRepository.findOne({ where: { id } });
    if (existing) {
      throw new ConflictException(`Le joueur avec l'ID "${id}" existe déjà.`);
    }

    const allPlayers = await this.playerRepository.find();
    const existingRanks = allPlayers.map((p) => p.rank);
    const initialRank = this.eloCalculator.calculateInitialRank(existingRanks);

    const newPlayer = this.playerRepository.create({ id, rank: initialRank });
    return await this.playerRepository.save(newPlayer);
  }

  /**
   * Recherche un joueur par son identifiant.
   *
   * @param {string} id - L'identifiant du joueur à trouver.
   * @returns {Promise<Player | null>} Le joueur trouvé ou null.
   */
  async findPlayerById(id: string): Promise<Player | null> {
    return await this.playerRepository.findOne({ where: { id } });
  }

  /**
   * Récupère tous les joueurs triés par classement décroissant.
   *
   * @returns {Promise<Player[]>} La liste des joueurs.
   */
  async getAllPlayers(): Promise<Player[]> {
    return await this.playerRepository.find({
      order: { rank: 'DESC' },
    });
  }

  /**
   * Met à jour le classement d'un joueur.
   *
   * @param {string} id - L'identifiant du joueur
   * @param {number} newRank - Le nouveau classement
   * @returns {Promise<Player>} Le joueur mis à jour
   */
  async updatePlayerRank(id: string, newRank: number): Promise<Player> {
    await this.playerRepository.update({ id }, { rank: newRank });
    const player = await this.playerRepository.findOne({ where: { id } });
    if (!player) {
      throw new Error(`Player with id ${id} not found after update`);
    }
    return player;
  }

  /**
   * Compte le nombre total de joueurs.
   *
   * @returns {Promise<number>} Le nombre de joueurs
   */
  async count(): Promise<number> {
    return await this.playerRepository.count();
  }
}
