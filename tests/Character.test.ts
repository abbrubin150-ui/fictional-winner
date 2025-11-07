/**
 * Character Unit Tests
 */

import { Character, CharacterRole, RelationType } from '../src/core/Character';

describe('Character', () => {
  describe('constructor', () => {
    it('should create a character with valid data', () => {
      const character = new Character(
        'char-1',
        'John Doe',
        'A brave protagonist',
        'protagonist'
      );

      expect(character.id).toBe('char-1');
      expect(character.name).toBe('John Doe');
      expect(character.description).toBe('A brave protagonist');
      expect(character.role).toBe('protagonist');
      expect(character.traits).toEqual([]);
      expect(character.relationships).toEqual([]);
      expect(character.scenePresence).toEqual([]);
    });

    it('should default to "other" role if not specified', () => {
      const character = new Character('char-1', 'Jane Doe', 'A character');
      expect(character.role).toBe('other');
    });

    it('should initialize metadata with timestamps', () => {
      const character = new Character('char-1', 'Test', 'Description');

      expect(character.metadata.createdAt).toBeInstanceOf(Date);
      expect(character.metadata.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('validate', () => {
    it('should pass validation for valid character', () => {
      const character = new Character('char-1', 'Test', 'Description', 'protagonist');
      const result = character.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for empty name', () => {
      const character = new Character('char-1', '', 'Description');
      const result = character.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Character must have a name');
    });

    it('should fail validation for empty description', () => {
      const character = new Character('char-1', 'Test', '');
      const result = character.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Character must have a description');
    });

    it('should fail validation for invalid relationship strength', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addRelationship({
        characterId: 'char-2',
        type: 'ally',
        strength: 15, // Invalid: should be 1-10
      });

      const result = character.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail validation for character arc without starting state', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.setArc({
        startingState: '',
        desiredEndState: 'Hero',
        turningPoints: [],
      });

      const result = character.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Character arc must have a starting state');
    });
  });

  describe('traits', () => {
    it('should add a trait', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addTrait('brave');

      expect(character.traits).toContain('brave');
    });

    it('should not add duplicate traits', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addTrait('brave');
      character.addTrait('brave');

      expect(character.traits).toEqual(['brave']);
    });

    it('should remove a trait', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addTrait('brave');
      character.removeTrait('brave');

      expect(character.traits).toHaveLength(0);
    });

    it('should handle removing non-existent trait', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.removeTrait('nonexistent');

      expect(character.traits).toHaveLength(0);
    });
  });

  describe('relationships', () => {
    it('should add a relationship', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addRelationship({
        characterId: 'char-2',
        type: 'ally',
        description: 'Best friend',
        strength: 8,
      });

      expect(character.relationships).toHaveLength(1);
      expect(character.relationships[0].characterId).toBe('char-2');
      expect(character.relationships[0].type).toBe('ally');
      expect(character.relationships[0].strength).toBe(8);
    });

    it('should replace existing relationship with same character', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addRelationship({
        characterId: 'char-2',
        type: 'ally',
        strength: 5,
      });
      character.addRelationship({
        characterId: 'char-2',
        type: 'enemy',
        strength: 9,
      });

      expect(character.relationships).toHaveLength(1);
      expect(character.relationships[0].type).toBe('enemy');
      expect(character.relationships[0].strength).toBe(9);
    });

    it('should remove a relationship', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addRelationship({
        characterId: 'char-2',
        type: 'ally',
        strength: 5,
      });
      character.removeRelationship('char-2');

      expect(character.relationships).toHaveLength(0);
    });

    it('should update a relationship', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addRelationship({
        characterId: 'char-2',
        type: 'ally',
        strength: 5,
      });
      character.updateRelationship('char-2', {
        type: 'enemy',
        strength: 9,
      });

      expect(character.relationships[0].type).toBe('enemy');
      expect(character.relationships[0].strength).toBe(9);
    });
  });

  describe('scene presence', () => {
    it('should add scene presence', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addScenePresence('scene-1');

      expect(character.scenePresence).toContain('scene-1');
    });

    it('should not add duplicate scene presence', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addScenePresence('scene-1');
      character.addScenePresence('scene-1');

      expect(character.scenePresence).toEqual(['scene-1']);
    });

    it('should remove scene presence', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addScenePresence('scene-1');
      character.removeScenePresence('scene-1');

      expect(character.scenePresence).toHaveLength(0);
    });

    it('should check if character is in scene', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addScenePresence('scene-1');

      expect(character.isInScene('scene-1')).toBe(true);
      expect(character.isInScene('scene-2')).toBe(false);
    });
  });

  describe('character arc', () => {
    it('should set character arc', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.setArc({
        startingState: 'Coward',
        desiredEndState: 'Hero',
        turningPoints: [],
      });

      expect(character.arcData?.startingState).toBe('Coward');
      expect(character.arcData?.desiredEndState).toBe('Hero');
    });

    it('should add turning point to arc', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.setArc({
        startingState: 'Coward',
        desiredEndState: 'Hero',
        turningPoints: [],
      });
      character.addTurningPoint('scene-1', 'Faces fear for the first time');

      expect(character.arcData?.turningPoints).toHaveLength(1);
      expect(character.arcData?.turningPoints[0].sceneId).toBe('scene-1');
      expect(character.arcData?.turningPoints[0].description).toBe('Faces fear for the first time');
    });

    it('should throw error when adding turning point without arc', () => {
      const character = new Character('char-1', 'Test', 'Description');

      expect(() => {
        character.addTurningPoint('scene-1', 'Test');
      }).toThrow('Character arc must be initialized before adding turning points');
    });

    it('should update arc state', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.setArc({
        startingState: 'Coward',
        desiredEndState: 'Hero',
        turningPoints: [],
      });
      character.updateArcState('Learning');

      expect(character.arcData?.currentState).toBe('Learning');
    });

    it('should throw error when updating state without arc', () => {
      const character = new Character('char-1', 'Test', 'Description');

      expect(() => {
        character.updateArcState('Test');
      }).toThrow('Character arc must be initialized before updating state');
    });
  });

  describe('update', () => {
    it('should update character properties', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.update({
        name: 'Updated Name',
        description: 'Updated Description',
        role: 'antagonist',
      });

      expect(character.name).toBe('Updated Name');
      expect(character.description).toBe('Updated Description');
      expect(character.role).toBe('antagonist');
    });

    it('should update timestamp on update', () => {
      const character = new Character('char-1', 'Test', 'Description');
      const originalTime = character.metadata.updatedAt;

      setTimeout(() => {
        character.update({ name: 'Updated' });
        expect(character.metadata.updatedAt.getTime()).toBeGreaterThanOrEqual(
          originalTime.getTime()
        );
      }, 1);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addTrait('brave');
      character.addTrait('strong');
      character.addScenePresence('scene-1');
      character.addScenePresence('scene-2');
      character.addRelationship({
        characterId: 'char-2',
        type: 'ally',
        strength: 5,
      });

      const stats = character.getStats();
      expect(stats.sceneCount).toBe(2);
      expect(stats.relationshipCount).toBe(1);
      expect(stats.traitCount).toBe(2);
      expect(stats.turningPointCount).toBe(0);
    });

    it('should include turning points in stats', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.setArc({
        startingState: 'Start',
        desiredEndState: 'End',
        turningPoints: [],
      });
      character.addTurningPoint('scene-1', 'Point 1');
      character.addTurningPoint('scene-2', 'Point 2');

      const stats = character.getStats();
      expect(stats.turningPointCount).toBe(2);
    });
  });

  describe('toJSON and fromJSON', () => {
    it('should convert to JSON', () => {
      const character = new Character('char-1', 'Test', 'Description', 'protagonist');
      character.addTrait('brave');
      character.addScenePresence('scene-1');

      const json = character.toJSON();
      expect(json.id).toBe('char-1');
      expect(json.name).toBe('Test');
      expect(json.traits).toEqual(['brave']);
      expect(json.scenePresence).toEqual(['scene-1']);
    });

    it('should create character from JSON', () => {
      const json = {
        id: 'char-1',
        name: 'Test',
        description: 'Description',
        role: 'protagonist' as CharacterRole,
        traits: ['brave', 'strong'],
        relationships: [
          {
            characterId: 'char-2',
            type: 'ally' as RelationType,
            strength: 8,
          },
        ],
        scenePresence: ['scene-1', 'scene-2'],
        metadata: {
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
      };

      const character = Character.fromJSON(json);
      expect(character.id).toBe('char-1');
      expect(character.name).toBe('Test');
      expect(character.traits).toEqual(['brave', 'strong']);
      expect(character.relationships).toHaveLength(1);
      expect(character.scenePresence).toEqual(['scene-1', 'scene-2']);
    });

    it('should preserve arc data in JSON roundtrip', () => {
      const character = new Character('char-1', 'Test', 'Description');
      character.setArc({
        startingState: 'Start',
        desiredEndState: 'End',
        turningPoints: [
          {
            sceneId: 'scene-1',
            description: 'First point',
            timestamp: new Date(),
          },
        ],
      });

      const json = character.toJSON();
      const restored = Character.fromJSON(json);

      expect(restored.arcData?.startingState).toBe('Start');
      expect(restored.arcData?.desiredEndState).toBe('End');
      expect(restored.arcData?.turningPoints).toHaveLength(1);
    });
  });

  describe('relationship types', () => {
    const relationshipTypes: RelationType[] = [
      'ally',
      'enemy',
      'family',
      'romantic',
      'mentor-student',
      'rival',
      'neutral',
    ];

    it.each(relationshipTypes)('should support %s relationship type', (type) => {
      const character = new Character('char-1', 'Test', 'Description');
      character.addRelationship({
        characterId: 'char-2',
        type,
        strength: 5,
      });

      expect(character.relationships[0].type).toBe(type);
    });
  });

  describe('character roles', () => {
    const roles: CharacterRole[] = [
      'protagonist',
      'antagonist',
      'supporting',
      'mentor',
      'foil',
      'comic-relief',
      'love-interest',
      'other',
    ];

    it.each(roles)('should support %s role', (role) => {
      const character = new Character('char-1', 'Test', 'Description', role);
      expect(character.role).toBe(role);
    });
  });
});
