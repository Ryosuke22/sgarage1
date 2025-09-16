import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type BidUpdate } from "@shared/schema";

export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connect = () => {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("WebSocket connected");
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "bidUpdate") {
            const bidUpdate: BidUpdate = message.data;
            
            // Update the cached vehicle data
            queryClient.setQueryData(["/api/vehicles"], (oldData: any) => {
              if (!oldData) return oldData;
              
              return oldData.map((vehicle: any) => {
                if (vehicle.id === bidUpdate.vehicleId) {
                  return {
                    ...vehicle,
                    currentPrice: bidUpdate.amount,
                    bidCount: bidUpdate.bidCount,
                  };
                }
                return vehicle;
              });
            });
            
            // Update individual vehicle data if cached
            queryClient.setQueryData(["/api/vehicles", bidUpdate.vehicleId], (oldData: any) => {
              if (!oldData) return oldData;
              
              return {
                ...oldData,
                currentPrice: bidUpdate.amount,
                bidCount: bidUpdate.bidCount,
              };
            });
            
            console.log("Bid update received:", bidUpdate);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      ws.onclose = () => {
        console.log("WebSocket disconnected, attempting to reconnect...");
        reconnectTimeout = setTimeout(connect, 3000);
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };
    
    connect();
    
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [queryClient]);
}
