/**
 * Arc Planner with A.R.I.D-5 Flow (Sprint 3)
 *
 * כלי תכנון לקשתות עלילתיות מבוסס A.R.I.D-5
 *
 * A.R.I.D-5 Flow:
 * - A: Anchor (establish arc) - עיגון הקשת, הצגת מצב ההתחלה
 * - R: Rise (build tension) - העלאת המתח, פיתוח הקונפליקט
 * - I: Impact (climax) - השיא, נקודת המפנה המרכזית
 * - D: Descent (resolution) - הירידה והפתרון, מצב חדש
 * - 5: Five-beat structure - מבנה של 5 פעימות מרכזיות
 *
 * תכונות:
 * - יצירת תבניות Arc מובנות
 * - ולידציה של מבנה A.R.I.D
 * - המלצות לשיפור מבנה הקשת
 * - ניתוח פאסינג (קצב)
 * - זיהוי חוסרים במבנה
 */

import { Arc, AridFlow } from '../core/Arc';
import { GraphDB } from '../core/GraphDB';

export interface ArcTemplate {
  name: string;
  description: string;
  suggestedStructure: AridFlow;
  sceneCount: {
    min: number;
    max: number;
    anchor: number;
    rise: number;
    impact: number;
    descent: number;
  };
  pacing: {
    anchorPercent: number; // % of total scenes
    risePercent: number;
    impactPercent: number;
    descentPercent: number;
  };
}

export interface ArcAnalysis {
  arc: Arc;
  score: number; // 0-100, quality score
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  pacing: {
    anchorPercent: number;
    risePercent: number;
    impactPercent: number;
    descentPercent: number;
    isBalanced: boolean;
  };
  structure: {
    hasAnchor: boolean;
    hasRise: boolean;
    hasImpact: boolean;
    hasDescent: boolean;
    hasFiveBeat: boolean;
    isComplete: boolean;
  };
}

export class ArcPlanner {
  private templates: Map<string, ArcTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeDefaultTemplates();
  }

  /**
   * אתחול תבניות ברירת מחדל
   */
  private initializeDefaultTemplates(): void {
    // Classic Hero's Journey
    this.addTemplate({
      name: 'hero-journey',
      description: "Classic Hero's Journey - מסע הגיבור הקלאסי",
      suggestedStructure: {
        anchor: [], // Will be filled dynamically
        rise: [],
        impact: [],
        descent: [],
      },
      sceneCount: {
        min: 8,
        max: 20,
        anchor: 2,
        rise: 4,
        impact: 2,
        descent: 2,
      },
      pacing: {
        anchorPercent: 20,
        risePercent: 40,
        impactPercent: 20,
        descentPercent: 20,
      },
    });

    // Three-Act Structure
    this.addTemplate({
      name: 'three-act',
      description: 'Three-Act Structure - מבנה שלוש מערכות',
      suggestedStructure: {
        anchor: [],
        rise: [],
        impact: [],
        descent: [],
      },
      sceneCount: {
        min: 6,
        max: 15,
        anchor: 2,
        rise: 3,
        impact: 1,
        descent: 2,
      },
      pacing: {
        anchorPercent: 25,
        risePercent: 50,
        impactPercent: 10,
        descentPercent: 15,
      },
    });

    // Kishōtenketsu (Japanese four-act)
    this.addTemplate({
      name: 'kishotenketsu',
      description: 'Kishōtenketsu - מבנה יפני ארבע מערכות',
      suggestedStructure: {
        anchor: [],
        rise: [],
        impact: [],
        descent: [],
      },
      sceneCount: {
        min: 8,
        max: 16,
        anchor: 2,
        rise: 2,
        impact: 2,
        descent: 2,
      },
      pacing: {
        anchorPercent: 25,
        risePercent: 25,
        impactPercent: 25,
        descentPercent: 25,
      },
    });

    // Tragedy Arc
    this.addTemplate({
      name: 'tragedy',
      description: 'Tragedy Arc - קשת טרגית',
      suggestedStructure: {
        anchor: [],
        rise: [],
        impact: [],
        descent: [],
      },
      sceneCount: {
        min: 7,
        max: 14,
        anchor: 2,
        rise: 4,
        impact: 3,
        descent: 1,
      },
      pacing: {
        anchorPercent: 20,
        risePercent: 40,
        impactPercent: 30,
        descentPercent: 10,
      },
    });

    // Redemption Arc
    this.addTemplate({
      name: 'redemption',
      description: 'Redemption Arc - קשת גאולה',
      suggestedStructure: {
        anchor: [],
        rise: [],
        impact: [],
        descent: [],
      },
      sceneCount: {
        min: 8,
        max: 16,
        anchor: 2,
        rise: 3,
        impact: 2,
        descent: 3,
      },
      pacing: {
        anchorPercent: 20,
        risePercent: 35,
        impactPercent: 20,
        descentPercent: 25,
      },
    });
  }

  /**
   * הוספת תבנית מותאמת אישית
   */
  addTemplate(template: ArcTemplate): void {
    this.templates.set(template.name, template);
  }

  /**
   * קבלת תבנית לפי שם
   */
  getTemplate(name: string): ArcTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * קבלת כל התבניות
   */
  getAllTemplates(): ArcTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * יצירת Arc חדש מתבנית
   */
  createFromTemplate(
    arcId: string,
    intent: string,
    templateName: string,
    scenes: string[]
  ): Arc {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    if (scenes.length < template.sceneCount.min) {
      throw new Error(
        `Arc requires at least ${template.sceneCount.min} scenes, got ${scenes.length}`
      );
    }

    const arc = new Arc(arcId, intent);

    // Add all scenes
    scenes.forEach(sceneId => arc.addScene(sceneId));

    // Auto-distribute scenes across ARID phases based on template pacing
    arc.initializeAridFlow();
    this.autoDistributeScenes(arc, template);

    return arc;
  }

  /**
   * התאמה אוטומטית של סצנות לפאזות ARID לפי תבנית
   */
  private autoDistributeScenes(arc: Arc, template: ArcTemplate): void {
    const totalScenes = arc.scenes.length;

    const anchorCount = Math.max(1, Math.round((totalScenes * template.pacing.anchorPercent) / 100));
    const riseCount = Math.max(1, Math.round((totalScenes * template.pacing.risePercent) / 100));
    const impactCount = Math.max(1, Math.round((totalScenes * template.pacing.impactPercent) / 100));

    let currentIndex = 0;

    // Anchor scenes
    for (let i = 0; i < anchorCount && currentIndex < totalScenes; i++) {
      arc.addToAridPhase('anchor', arc.scenes[currentIndex++]);
    }

    // Rise scenes
    for (let i = 0; i < riseCount && currentIndex < totalScenes; i++) {
      arc.addToAridPhase('rise', arc.scenes[currentIndex++]);
    }

    // Impact scenes
    for (let i = 0; i < impactCount && currentIndex < totalScenes; i++) {
      arc.addToAridPhase('impact', arc.scenes[currentIndex++]);
    }

    // Descent scenes
    while (currentIndex < totalScenes) {
      arc.addToAridPhase('descent', arc.scenes[currentIndex++]);
    }

    // Set five-beat if we have enough scenes
    if (totalScenes >= 5) {
      const beat1 = arc.scenes[0]; // Opening
      const beat2 = arc.scenes[Math.floor(totalScenes * 0.15)]; // Inciting incident (~15%)
      const beat3 = arc.scenes[Math.floor(totalScenes * 0.5)]; // Midpoint
      const beat4 = arc.scenes[Math.floor(totalScenes * 0.75)]; // Crisis (~75%)
      const beat5 = arc.scenes[totalScenes - 1]; // Resolution

      arc.setFiveBeat(beat1, beat2, beat3, beat4, beat5);
    }
  }

  /**
   * ניתוח קשת והצעת שיפורים
   */
  analyzeArc(arc: Arc, graph?: GraphDB): ArcAnalysis {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check structure
    const hasAnchor = arc.aridFlow ? arc.aridFlow.anchor.length > 0 : false;
    const hasRise = arc.aridFlow ? arc.aridFlow.rise.length > 0 : false;
    const hasImpact = arc.aridFlow ? arc.aridFlow.impact.length > 0 : false;
    const hasDescent = arc.aridFlow ? arc.aridFlow.descent.length > 0 : false;
    const hasFiveBeat = arc.aridFlow?.fiveBeat !== undefined;
    const isComplete = hasAnchor && hasRise && hasImpact && hasDescent;

    // Validate basic structure
    if (!arc.aridFlow) {
      weaknesses.push('Arc does not have ARID Flow structure defined');
      suggestions.push('Initialize ARID Flow with arc.initializeAridFlow()');
      score -= 30;
    } else {
      // Check each phase
      if (!hasAnchor) {
        weaknesses.push('Missing Anchor phase - no establishment of status quo');
        suggestions.push('Add 1-2 scenes to the Anchor phase to establish the starting situation');
        score -= 15;
      } else {
        strengths.push(`Anchor phase established with ${arc.aridFlow.anchor.length} scene(s)`);
      }

      if (!hasRise) {
        weaknesses.push('Missing Rise phase - no tension building');
        suggestions.push('Add scenes to the Rise phase to build tension and develop conflict');
        score -= 15;
      } else {
        strengths.push(`Rise phase has ${arc.aridFlow.rise.length} scene(s) building tension`);
      }

      if (!hasImpact) {
        weaknesses.push('Missing Impact phase - no climax');
        suggestions.push('Add 1-2 scenes to the Impact phase for the climactic moment');
        score -= 20;
      } else {
        strengths.push(`Impact phase has ${arc.aridFlow.impact.length} scene(s) for climax`);
      }

      if (!hasDescent) {
        weaknesses.push('Missing Descent phase - no resolution');
        suggestions.push('Add scenes to the Descent phase to resolve the arc');
        score -= 15;
      } else {
        strengths.push(`Descent phase has ${arc.aridFlow.descent.length} scene(s) for resolution`);
      }

      if (!hasFiveBeat && arc.scenes.length >= 5) {
        weaknesses.push('Five-Beat structure not defined');
        suggestions.push('Define five key beats to strengthen the narrative structure');
        score -= 10;
      } else if (hasFiveBeat) {
        strengths.push('Five-Beat structure properly defined');
      }
    }

    // Analyze pacing
    const pacing = this.calculatePacing(arc);

    if (!pacing.isBalanced) {
      weaknesses.push('Pacing is unbalanced - some phases are too long or too short');
      suggestions.push(
        'Consider redistributing scenes: Anchor ~20%, Rise ~40%, Impact ~20%, Descent ~20%'
      );
      score -= 10;
    } else {
      strengths.push('Pacing is well-balanced across all phases');
    }

    // Check scene count
    if (arc.scenes.length < 5) {
      weaknesses.push('Arc has very few scenes (< 5) - may lack depth');
      suggestions.push('Consider adding more scenes to fully develop the arc');
      score -= 10;
    } else if (arc.scenes.length > 25) {
      weaknesses.push('Arc has many scenes (> 25) - may lose focus');
      suggestions.push('Consider splitting into multiple arcs or removing redundant scenes');
      score -= 5;
    }

    // Validate ARID flow
    if (arc.aridFlow) {
      const aridValidation = arc.validateAridFlow();
      if (!aridValidation.valid) {
        weaknesses.push(...aridValidation.errors);
        score -= 15;
      }
    }

    // Check scene links if graph provided
    if (graph) {
      const linkAnalysis = this.analyzeLinkCoherence(arc, graph);
      if (!linkAnalysis.coherent) {
        weaknesses.push(...linkAnalysis.issues);
        suggestions.push(...linkAnalysis.suggestions);
        score -= linkAnalysis.severityScore;
      } else {
        strengths.push('Scene links are coherent and well-structured');
      }
    }

    score = Math.max(0, Math.min(100, score));

    return {
      arc,
      score,
      strengths,
      weaknesses,
      suggestions,
      pacing,
      structure: {
        hasAnchor,
        hasRise,
        hasImpact,
        hasDescent,
        hasFiveBeat,
        isComplete,
      },
    };
  }

  /**
   * חישוב פאסינג (קצב) של הקשת
   */
  private calculatePacing(arc: Arc): {
    anchorPercent: number;
    risePercent: number;
    impactPercent: number;
    descentPercent: number;
    isBalanced: boolean;
  } {
    if (!arc.aridFlow || arc.scenes.length === 0) {
      return {
        anchorPercent: 0,
        risePercent: 0,
        impactPercent: 0,
        descentPercent: 0,
        isBalanced: false,
      };
    }

    const total = arc.scenes.length;
    const anchorPercent = (arc.aridFlow.anchor.length / total) * 100;
    const risePercent = (arc.aridFlow.rise.length / total) * 100;
    const impactPercent = (arc.aridFlow.impact.length / total) * 100;
    const descentPercent = (arc.aridFlow.descent.length / total) * 100;

    // Check if pacing is balanced (rough guidelines)
    // Anchor: 15-30%, Rise: 30-50%, Impact: 15-25%, Descent: 15-30%
    const isBalanced =
      anchorPercent >= 10 &&
      anchorPercent <= 35 &&
      risePercent >= 25 &&
      risePercent <= 55 &&
      impactPercent >= 10 &&
      impactPercent <= 30 &&
      descentPercent >= 10 &&
      descentPercent <= 35;

    return {
      anchorPercent,
      risePercent,
      impactPercent,
      descentPercent,
      isBalanced,
    };
  }

  /**
   * ניתוח קוהרנטיות הקישורים בקשת
   */
  private analyzeLinkCoherence(
    arc: Arc,
    graph: GraphDB
  ): {
    coherent: boolean;
    issues: string[];
    suggestions: string[];
    severityScore: number;
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let severityScore = 0;

    // Check if scenes link forward in the arc
    for (let i = 0; i < arc.scenes.length - 1; i++) {
      const currentSceneId = arc.scenes[i];
      const nextSceneId = arc.scenes[i + 1];
      const currentScene = graph.getScene(currentSceneId);

      if (!currentScene) {
        issues.push(`Scene ${currentSceneId} not found in graph`);
        severityScore += 10;
        continue;
      }

      // Check if current scene links to next scene
      if (!currentScene.links.includes(nextSceneId)) {
        issues.push(
          `Scene ${i} ("${currentScene.title}") doesn't link to the next scene in arc`
        );
        suggestions.push(
          `Add a link from scene "${currentScene.title}" to the following scene`
        );
        severityScore += 3;
      }
    }

    // Check for broken links outside the arc
    for (const sceneId of arc.scenes) {
      const scene = graph.getScene(sceneId);
      if (!scene) continue;

      for (const linkId of scene.links) {
        if (!arc.scenes.includes(linkId)) {
          issues.push(
            `Scene "${scene.title}" links to scene outside the arc (${linkId})`
          );
          suggestions.push(
            'Consider if this external link is intentional or should be within the arc'
          );
          severityScore += 1;
        }
      }
    }

    return {
      coherent: issues.length === 0,
      issues,
      suggestions,
      severityScore,
    };
  }

  /**
   * המלצה על תבנית מתאימה לקשת קיימת
   */
  recommendTemplate(arc: Arc): { template: ArcTemplate; matchScore: number } | null {
    if (arc.scenes.length === 0) {
      return null;
    }

    let bestMatch: { template: ArcTemplate; matchScore: number } | null = null;

    for (const template of this.templates.values()) {
      const score = this.calculateTemplateMatch(arc, template);
      if (!bestMatch || score > bestMatch.matchScore) {
        bestMatch = { template, matchScore: score };
      }
    }

    return bestMatch;
  }

  /**
   * חישוב התאמה של קשת לתבנית
   */
  private calculateTemplateMatch(arc: Arc, template: ArcTemplate): number {
    let score = 0;

    // Check scene count
    if (arc.scenes.length >= template.sceneCount.min && arc.scenes.length <= template.sceneCount.max) {
      score += 30;
    } else {
      score += Math.max(
        0,
        30 - Math.abs(arc.scenes.length - template.sceneCount.min) * 2
      );
    }

    // Check pacing if ARID flow exists
    if (arc.aridFlow) {
      const pacing = this.calculatePacing(arc);

      const anchorDiff = Math.abs(pacing.anchorPercent - template.pacing.anchorPercent);
      const riseDiff = Math.abs(pacing.risePercent - template.pacing.risePercent);
      const impactDiff = Math.abs(pacing.impactPercent - template.pacing.impactPercent);
      const descentDiff = Math.abs(pacing.descentPercent - template.pacing.descentPercent);

      const avgDiff = (anchorDiff + riseDiff + impactDiff + descentDiff) / 4;

      score += Math.max(0, 70 - avgDiff * 2);
    } else {
      score += 35; // Neutral score if no ARID flow
    }

    return score;
  }

  /**
   * יצירת דוח ויזואלי של הקשת
   */
  visualizeArc(arc: Arc): string {
    if (!arc.aridFlow) {
      return 'Arc does not have ARID Flow structure';
    }

    let viz = '\n=== ARC VISUALIZATION ===\n\n';
    viz += `Arc: ${arc.intent}\n`;
    viz += `Total Scenes: ${arc.scenes.length}\n\n`;

    const pacing = this.calculatePacing(arc);

    viz += `📍 ANCHOR (${arc.aridFlow.anchor.length} scenes, ${pacing.anchorPercent.toFixed(1)}%)\n`;
    arc.aridFlow.anchor.forEach((sceneId, i) => {
      viz += `  ${i + 1}. ${sceneId}\n`;
    });
    viz += '\n';

    viz += `📈 RISE (${arc.aridFlow.rise.length} scenes, ${pacing.risePercent.toFixed(1)}%)\n`;
    arc.aridFlow.rise.forEach((sceneId, i) => {
      viz += `  ${i + 1}. ${sceneId}\n`;
    });
    viz += '\n';

    viz += `💥 IMPACT (${arc.aridFlow.impact.length} scenes, ${pacing.impactPercent.toFixed(1)}%)\n`;
    arc.aridFlow.impact.forEach((sceneId, i) => {
      viz += `  ${i + 1}. ${sceneId}\n`;
    });
    viz += '\n';

    viz += `📉 DESCENT (${arc.aridFlow.descent.length} scenes, ${pacing.descentPercent.toFixed(1)}%)\n`;
    arc.aridFlow.descent.forEach((sceneId, i) => {
      viz += `  ${i + 1}. ${sceneId}\n`;
    });
    viz += '\n';

    if (arc.aridFlow.fiveBeat) {
      viz += '🎵 FIVE-BEAT STRUCTURE:\n';
      viz += `  1. Opening: ${arc.aridFlow.fiveBeat.beat1}\n`;
      viz += `  2. Inciting: ${arc.aridFlow.fiveBeat.beat2}\n`;
      viz += `  3. Midpoint: ${arc.aridFlow.fiveBeat.beat3}\n`;
      viz += `  4. Crisis: ${arc.aridFlow.fiveBeat.beat4}\n`;
      viz += `  5. Resolution: ${arc.aridFlow.fiveBeat.beat5}\n`;
    }

    viz += '\n=========================\n';

    return viz;
  }
}
