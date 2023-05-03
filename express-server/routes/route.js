module.exports = (app) => {
  const Clients = require("../controllers/controller");

  const router = require("express").Router();

  // Insert new client
  router.post("/", Clients.insert);

  // Retrieve all Clients
  router.get("/", Clients.findAll);

  // Retrieve Client with specific id
  router.get("/:id", Clients.findOne);

  //   // Update Client with specific id
  //   router.put("/:id", Clients.update);

  //   // Delete Client with specific id
  //   router.delete("/:id", Clients.delete);

  app.use("/api/Clients", router);
};
