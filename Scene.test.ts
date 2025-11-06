/**
 * Scene Unit Tests
 */

import { Scene } from '../src/core/Scene';

describe('Scene', () => {
  describe('constructor', () => {
    it('should create a scene with valid data', () => {
      const scene = new Scene(
        'test-1',
        'Test Scene',
        'A test premise',
        'Test why',
        'Test how',
        2.5
      );

      expect(scene.id).toBe('test-1');
      expect(scene.title).toBe('Test Scene');
      expect(scene.premise).toBe('A test premise');
      expect(scene.cost).toBe(2.5);
      expect(scene.links).toEqual([]);
    });

    it('should initialize metadata with timestamps', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', 1);

      expect(scene.metadata.createdAt).toBeInstanceOf(Date);
      expect(scene.metadata.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('validate', () => {
    it('should pass validation for valid scene', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', 1);
      const result = scene.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for empty title', () => {
      const scene = new Scene('test-1', '', 'P', 'W', 'H', 1);
      const result = scene.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Scene must have a title');
    });

    it('should fail validation for negative cost', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', -1);
      const result = scene.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Scene cost cannot be negative');
    });
  });

  describe('addLink', () => {
    it('should add a link to another scene', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', 1);
      scene.addLink('test-2');

      expect(scene.links).toContain('test-2');
    });

    it('should not add duplicate links', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', 1);
      scene.addLink('test-2');
      scene.addLink('test-2');

      expect(scene.links).toEqual(['test-2']);
    });

    it('should update timestamp when link added', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', 1);
      const originalTime = scene.metadata.updatedAt;

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        scene.addLink('test-2');
        expect(scene.metadata.updatedAt.getTime()).toBeGreaterThan(
          originalTime.getTime()
        );
      }, 10);
    });
  });

  describe('removeLink', () => {
    it('should remove existing link', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', 1);
      scene.addLink('test-2');
      scene.removeLink('test-2');

      expect(scene.links).toHaveLength(0);
    });

    it('should handle removing non-existent link', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', 1);
      scene.removeLink('test-2');

      expect(scene.links).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update scene properties', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', 1);
      scene.update({
        title: 'Updated Title',
        cost: 3.0,
      });

      expect(scene.title).toBe('Updated Title');
      expect(scene.cost).toBe(3.0);
      expect(scene.premise).toBe('P'); // unchanged
    });

    it('should update timestamp on update', () => {
      const scene = new Scene('test-1', 'Test', 'P', 'W', 'H', 1);
      const originalTime = scene.metadata.updatedAt;

      setTimeout(() => {
        scene.update({ title: 'New Title' });
        expect(scene.metadata.updatedAt.getTime()).toBeGreaterThan(
          originalTime.getTime()
        );
      }, 10);
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize and deserialize correctly', () => {
      const original = new Scene('test-1', 'Test', 'P', 'W', 'H', 2.5);
      original.addLink('test-2');

      const json = original.toJSON();
      const restored = Scene.fromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.title).toBe(original.title);
      expect(restored.cost).toBe(original.cost);
      expect(restored.links).toEqual(original.links);
    });
  });
});
