import { useEffect, useRef } from "react";

export function useSSE(url: string | null, onMessage: (data: any) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new EventSource connection
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.addEventListener("bid", (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ type: "bid", data });
      } catch (error) {
        console.error("Error parsing bid event:", error);
      }
    });

    eventSource.addEventListener("auction_ended", (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ type: "auction_ended", data });
      } catch (error) {
        console.error("Error parsing auction_ended event:", error);
      }
    });

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      // EventSource will automatically try to reconnect
    };

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [url, onMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
}
