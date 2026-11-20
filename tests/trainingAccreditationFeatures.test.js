import { describe, it } from 'node:test';
import assert from 'node:assert';
import { trainingCourses } from '../src/data/dcvcData.js';

describe('DCVC P.R.I.D.E. Training & Business Accreditation Features', () => {
  it('includes the flagship DCVC Affirming Business Accreditation course', () => {
    const bizCourse = trainingCourses.find((c) => c.slug === 'dcvc-affirming-business');
    assert.ok(bizCourse, 'DCVC Affirming Business Accreditation course must exist');
    assert.strictEqual(bizCourse.isBusinessAccreditation, true);
    assert.ok(bizCourse.title.includes('DCVC Affirming Business Accreditation'));
    assert.ok(bizCourse.materials.some((m) => m.toLowerCase().includes('window cling') || m.toLowerCase().includes('window decal')));
    assert.ok(bizCourse.materials.some((m) => m.toLowerCase().includes('certificate')));
  });

  it('covers core competencies: frontline customer care, all-gender restrooms, de-escalation, and SB 396', () => {
    const bizCourse = trainingCourses.find((c) => c.slug === 'dcvc-affirming-business');
    assert.ok(bizCourse);
    const combinedObjectives = bizCourse.learningObjectives.join(' ');
    assert.match(combinedObjectives, /customer care|hospitality|welcoming/i);
    assert.match(combinedObjectives, /restroom/i);
    assert.match(combinedObjectives, /de-escalation/i);
    assert.match(combinedObjectives, /SB 396|workplace/i);
  });

  it('strictly contains zero "4 hour" / "4-hour" copy across all courses', () => {
    for (const course of trainingCourses) {
      assert.doesNotMatch(
        JSON.stringify(course),
        /4\s*-?\s*hour/i,
        `Course ${course.slug} must not contain 4 hour reference`
      );
    }
  });

  it('supports diverse sectors: business, corporate, healthcare, wellness, and youth', () => {
    const sectors = new Set(trainingCourses.map((c) => c.sector));
    assert.ok(sectors.has('business'), 'Must have business sector');
    assert.ok(sectors.has('corporate'), 'Must have corporate sector');
    assert.ok(sectors.has('healthcare'), 'Must have healthcare sector');
    assert.ok(sectors.has('youth'), 'Must have youth sector');
    assert.ok(sectors.has('wellness'), 'Must have wellness sector');
  });

  it('includes comprehensive participant materials and verified directory deliverables', () => {
    const accreditedCourses = trainingCourses.filter((c) => c.isBusinessAccreditation);
    assert.ok(accreditedCourses.length >= 3, 'Must have at least 3 business-accreditation eligible courses');
    for (const course of accreditedCourses) {
      assert.ok(Array.isArray(course.materials) && course.materials.length >= 3);
    }
  });
});
