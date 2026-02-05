import { validate } from 'class-validator';
import { CreateMatchDto } from './create-match.dto';

describe('CreateMatchDto', () => {
  it('should validate a correct match DTO with winner and loser', async () => {
    const dto = new CreateMatchDto();
    dto.winner = 'player1';
    dto.loser = 'player2';
    dto.draw = false;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a draw match', async () => {
    const dto = new CreateMatchDto();
    dto.winner = 'player1';
    dto.loser = 'player2';
    dto.draw = true;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate when draw is omitted (optional)', async () => {
    const dto = new CreateMatchDto();
    dto.winner = 'player1';
    dto.loser = 'player2';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when winner is empty', async () => {
    const dto = new CreateMatchDto();
    dto.winner = '';
    dto.loser = 'player2';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('winner');
  });

  it('should fail validation when loser is empty', async () => {
    const dto = new CreateMatchDto();
    dto.winner = 'player1';
    dto.loser = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('loser');
  });

  it('should fail validation when winner is missing', async () => {
    const dto = new CreateMatchDto();
    dto.loser = 'player2';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const winnerError = errors.find((e) => e.property === 'winner');
    expect(winnerError).toBeDefined();
  });

  it('should fail validation when loser is missing', async () => {
    const dto = new CreateMatchDto();
    dto.winner = 'player1';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const loserError = errors.find((e) => e.property === 'loser');
    expect(loserError).toBeDefined();
  });

  it('should fail validation when winner is not a string', async () => {
    const dto = new CreateMatchDto();
    (dto as any).winner = 123;
    dto.loser = 'player2';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation when loser is not a string', async () => {
    const dto = new CreateMatchDto();
    dto.winner = 'player1';
    (dto as any).loser = 456;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation when draw is not a boolean', async () => {
    const dto = new CreateMatchDto();
    dto.winner = 'player1';
    dto.loser = 'player2';
    (dto as any).draw = 'yes';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const drawError = errors.find((e) => e.property === 'draw');
    expect(drawError).toBeDefined();
  });

  it('should accept various player ID formats', async () => {
    const playerPairs = [
      ['alice', 'bob'],
      ['player1', 'player2'],
      ['user_123', 'user_456'],
      ['team-a-player1', 'team-b-player2'],
    ];

    for (const [winner, loser] of playerPairs) {
      const dto = new CreateMatchDto();
      dto.winner = winner;
      dto.loser = loser;
      dto.draw = false;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});

