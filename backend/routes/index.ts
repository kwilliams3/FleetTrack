import express from "express";
import { getDBData, exportSQL, exportMySQL, resetDB } from "../controllers/dbController";
import { addOrUpdateVehicle, deleteVehicle } from "../controllers/vehicleController";
import { addOrUpdateChauffeur, deleteChauffeur, assignVehicle } from "../controllers/chauffeurController";
import { declarePayment, validatePayment } from "../controllers/paymentController";
import { declareExpense, validateExpense } from "../controllers/expenseController";
import { logActivity } from "../controllers/activityController";
import { addOrUpdateUser, deleteUser, resetUserPassword, changeUserPassword } from "../controllers/userController";

const router = express.Router();

// General Database
router.get("/data", getDBData);
router.get("/export-sql", exportSQL);
router.get("/export-mysql", exportMySQL);
router.post("/reset", resetDB);

// Users (Admin Only / Authentication operation)
router.post("/users", addOrUpdateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/reset-password", resetUserPassword);
router.post("/users/change-password", changeUserPassword);


// Vehicles
router.post("/vehicles", addOrUpdateVehicle);
router.delete("/vehicles/:id", deleteVehicle);

// Chauffeurs & Assignments
router.post("/chauffeurs", addOrUpdateChauffeur);
router.delete("/chauffeurs/:id", deleteChauffeur);
router.post("/affectations", assignVehicle);

// Payments (Versements)
router.post("/versements", declarePayment);
router.post("/versements/validate", validatePayment);

// Expenses (Charges)
router.post("/charges", declareExpense);
router.post("/charges/validate", validateExpense);

// Activities (Présence/Activités)
router.post("/activites", logActivity);

export default router;
