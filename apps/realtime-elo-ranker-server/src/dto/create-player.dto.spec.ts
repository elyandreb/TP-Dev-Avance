import { validate } from 'class-validator';
import { CreatePlayerDto } from './create-player.dto';

describe('CreatePlayerDto', () => {
  it('should validate a correct player DTO', async () => {
    const dto = new CreatePlayerDto();
    dto.id = 'player1';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when id is empty', async () => {
    const dto = new CreatePlayerDto();
    dto.id = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('id');
  });

  it('should fail validation when id is missing', async () => {
    const dto = new CreatePlayerDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('id');
  });

  it('should fail validation when id is not a string', async () => {
    const dto = new CreatePlayerDto();
    (dto as any).id = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept alphanumeric player IDs', async () => {
    const validIds = ['player1', 'alice', 'bob123', 'user_42'];

    for (const id of validIds) {
      const dto = new CreatePlayerDto();
      dto.id = id;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should accept player IDs with special characters', async () => {
    const dto = new CreatePlayerDto();
    dto.id = 'player-with-dashes';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
