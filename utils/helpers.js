export class Helpers {
  /**
   * Generates a random string
   * @param {number} length 
   * @returns {string}
   */
  static generateRandomString(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  /**
   * Generates a random email
   * @returns {string}
   */
  static generateRandomEmail() {
    return `testuser_${this.generateRandomString()}@example.com`;
  }

  /**
   * Generates mock data for a new organization member
   * @returns {Object} { name, email, contact }
   */
  static generateMemberData() {
    const uniqueId = new Date().getTime();
    const name = `Automation Org Member ${uniqueId}`;
    const email = `automation.member.${uniqueId}@gmail.com`;
    // Generate an 11 digit contact number starting with 017
    const randomDigits = this.generateRandomString(8).replace(/\D/g, '').padEnd(8, '0');
    const contact = `017${randomDigits}`;
    
    return { name, email, contact };
  }

  /**
   * Generates mock data for a new tower
   * @returns {Object} { name, floors, unitsPerFloor, description, unitNaming }
   */
  static generateTowerData() {
    const uniqueId = new Date().getTime();
    const name = `Test Tower ${uniqueId}`;
    const description = `Automation test tower created at ${new Date().toISOString()}`;
    const floors = Math.floor(Math.random() * 10) + 3; // 3-12 floors
    const unitsPerFloor = Math.floor(Math.random() * 6) + 2; // 2-7 units per floor
    const unitNaming = Math.random() > 0.5 ? 'numerical' : 'alphabetical';
    
    return { name, floors, unitsPerFloor, description, unitNaming };
  }

  /**
   * Generates mock data for unit information
   * @returns {Object} { area, bathrooms, rooms, balconies }
   */
  static generateUnitData() {
    const area = Math.floor(Math.random() * 3000) + 800; // 800-3800 sq ft
    const bathrooms = Math.floor(Math.random() * 4) + 1; // 1-4 bathrooms
    const rooms = Math.floor(Math.random() * 5) + 1; // 1-5 rooms
    const balconies = Math.floor(Math.random() * 3); // 0-2 balconies
    
    return { area, bathrooms, rooms, balconies };
  }

  /**
   * Generates mock data for unit owner with all details
   * @returns {Object} { member: {firstName, lastName, email, phone}, percentage, date }
   */
  static generateOwnerData() {
    const uniqueId = new Date().getTime();
    const firstName = `Owner${uniqueId}`;
    const lastName = `Test`;
    const email = `owner.${uniqueId}@example.com`;
    const phone = `+880${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    // Ownership percentage (1-100)
    const percentage = Math.floor(Math.random() * 100) + 1;
    
    // Ownership date (random date in past year)
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return { 
      member: { firstName, lastName, email, phone },
      percentage,
      date: dateString
    };
  }
}
