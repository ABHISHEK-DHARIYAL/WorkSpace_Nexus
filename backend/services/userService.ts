const { collection, getDocs, db } = require("../config/db");

class UserService {
  static async getAll() {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      if (data.password) delete data.password;
      return data;
    });
  }
}


module.exports = {
  UserService
};
