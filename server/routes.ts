import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertBidSchema, type BidUpdate } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        yearFrom: req.query.yearFrom ? parseInt(req.query.yearFrom as string) : undefined,
        yearTo: req.query.yearTo ? parseInt(req.query.yearTo as string) : undefined,
        brand: req.query.brand as string,
        search: req.query.search as string,
      };
      
      const vehicles = await storage.getVehicles(filters);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ error: "Failed to fetch vehicle" });
    }
  });

  // Bid routes
  app.post("/api/vehicles/:vehicleId/bids", async (req, res) => {
    try {
      const bidData = {
        vehicleId: req.params.vehicleId,
        bidderId: req.body.bidderId || "anonymous",
        amount: req.body.amount,
      };

      const validatedBid = insertBidSchema.parse(bidData);
      
      // Check if vehicle exists
      const vehicle = await storage.getVehicle(validatedBid.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      // Check if auction is still active
      if (new Date() > new Date(vehicle.endTime)) {
        return res.status(400).json({ error: "Auction has ended" });
      }

      // Check if bid amount is higher than current price
      const bidAmount = parseFloat(validatedBid.amount);
      const currentPrice = parseFloat(vehicle.currentPrice);
      if (bidAmount <= currentPrice) {
        return res.status(400).json({ error: "Bid amount must be higher than current price" });
      }

      const bid = await storage.createBid(validatedBid);
      
      // Broadcast bid update to all connected WebSocket clients
      const bidUpdate: BidUpdate = {
        vehicleId: validatedBid.vehicleId,
        amount: validatedBid.amount,
        bidCount: vehicle.bidCount + 1,
        bidderId: validatedBid.bidderId,
        bidderUsername: `ユーザー${validatedBid.bidderId.slice(-4)}`,
      };
      
      broadcastBidUpdate(bidUpdate);
      
      res.status(201).json(bid);
    } catch (error) {
      console.error("Error creating bid:", error);
      res.status(500).json({ error: "Failed to create bid" });
    }
  });

  app.get("/api/vehicles/:vehicleId/bids", async (req, res) => {
    try {
      const bids = await storage.getBidsForVehicle(req.params.vehicleId);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ error: "Failed to fetch bids" });
    }
  });

  // Favorite routes
  app.post("/api/favorites", async (req, res) => {
    try {
      const favoriteData = {
        userId: req.body.userId || "anonymous",
        vehicleId: req.body.vehicleId,
      };

      const favorite = await storage.addFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:userId/:vehicleId", async (req, res) => {
    try {
      await storage.removeFavorite(req.params.userId, req.params.vehicleId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time bid updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  function broadcastBidUpdate(bidUpdate: BidUpdate) {
    const message = JSON.stringify({
      type: 'bidUpdate',
      data: bidUpdate,
    });
    
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  return httpServer;
}
