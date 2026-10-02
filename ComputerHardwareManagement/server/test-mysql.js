import sequelize from "./config/mysql.js";

try {
    await sequelize.authenticate();
    console.log("✅ MySQL Connected Successfully!");
} catch (error) {
    console.error("❌ MySQL Connection Failed:");
    console.error(error.message);
} finally {
    await sequelize.close();
}