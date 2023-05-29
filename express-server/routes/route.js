module.exports = (app) => {
  const Clients = require("../controllers/controller");
  const Events = require("../controllers/controller");
  const Users = require("../controllers/controller")

  const router = require("express").Router();

  // Clients routes
  router.post("/clients", Clients.insert);
  router.get("/clients", Clients.findAll);
  router.get("/clients/:id", Clients.findOne);
  router.put("/clients/:id", Clients.update);
  router.delete("/clients/:id", Clients.delete);

  // Events routes
  router.post("/events", Events.insertEvent);
  router.get("/events", Events.findAllEvents);
  // router.get("/events/:id", Events.findOneEvent);
  // router.put("/events/:id", Events.updateEvent);
  router.delete("/events/:id", Events.deleteEvent);

  router.get("/users/checkAdmin", Users.checkAdminAuthentication)
  router.post("/users/checkAdmin", Users.checkAdminAuthentication)
  


  app.use("/api", router);
};