/**
 * Deterministic, collision-free test-data generators.
 *
 * Uniqueness comes from a per-run base id plus a monotonic counter rather than
 * Math.random(), so values are unique within and across runs while keeping
 * failures reproducible (no random branching in test data).
 */
const RUN_ID = Date.now();
let seq = 0;

export class Helpers {
  /** Monotonic, run-unique numeric id. */
  static uniqueId() {
    seq += 1;
    return `${RUN_ID}${String(seq).padStart(3, '0')}`;
  }

  /** Run-unique 11-digit BD-style contact number (017XXXXXXXX). */
  static uniqueContact() {
    const digits = this.uniqueId().slice(-8).padStart(8, '0');
    return `017${digits}`;
  }

  static generateMemberData() {
    const id = this.uniqueId();
    return {
      name: `Automation Org Member ${id}`,
      email: `automation.member.${id}@gmail.com`,
      contact: this.uniqueContact(),
    };
  }

  /**
   * Member data with every optional General-Information field populated.
   * Addresses/NID embed the unique name so they're individually assertable on
   * the profile page. dob is a fixed past Date (datepicker-friendly).
   */
  static generateFullMemberData() {
    const base = this.generateMemberData();
    return {
      ...base,
      nidNumber: this.uniqueId().slice(-13).padStart(13, '0'),
      permanentAddress: `Permanent Addr ${base.name}`,
      presentAddress: `Present Addr ${base.name}`,
      occupation: 'Software Engineer',
      gender: 'Male',
      maritalStatus: 'Single',
      religion: 'Islam',
      description: `Automation profile for ${base.name}`,
      facebook: 'https://facebook.com/automation.qa',
      linkedin: 'https://linkedin.com/in/automation.qa',
      dob: new Date(1990, 5, 15), // 1990-06-15
    };
  }

  static generateTowerData() {
    const id = this.uniqueId();
    return {
      name: `Test Tower ${id}`,
      description: `Automation test tower ${id}`,
      floors: 5,
      unitsPerFloor: 4,
      unitNaming: 'numerical',
    };
  }

  static generateUnitData() {
    return { area: 1500, bathrooms: 2, rooms: 3, balconies: 1 };
  }

  static generateOwnerData() {
    const id = this.uniqueId();
    const date = new Date();
    date.setDate(date.getDate() - 1); // yesterday — stable, in-range
    return {
      member: {
        firstName: `Owner${id}`,
        lastName: 'Test',
        email: `owner.${id}@example.com`,
        phone: this.uniqueContact(),
      },
      percentage: 100,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
    };
  }
}
