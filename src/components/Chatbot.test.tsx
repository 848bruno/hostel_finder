import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Chatbot from "./Chatbot";

let mockUser: {
  id: string;
  username: string;
  email: string;
  role: "student" | "owner" | "admin";
} | null = null;

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const omittedProps = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "whileHover",
    "whileTap",
    "layout",
  ]);

  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) =>
        React.forwardRef<HTMLElement, ComponentProps<"div">>(({ children, ...props }, ref) => {
          const domProps = Object.fromEntries(
            Object.entries(props).filter(([key]) => !omittedProps.has(key))
          );

          return React.createElement(tag, { ...domProps, ref }, children);
        }),
    }
  );

  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

const fetchMock = vi.fn<typeof fetch>();
const writeTextMock = vi.fn<(value: string) => Promise<void>>();

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

describe("Chatbot", () => {
  beforeEach(() => {
    mockUser = null;
    fetchMock.mockReset();
    writeTextMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
    localStorage.clear();
  });

  it("restores a saved chat session from the backend", async () => {
    localStorage.setItem("shf_chatbot_session_id", "session-123");
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        sessionId: "session-123",
        messages: [
          {
            id: "m1",
            role: "user",
            content: "Need a hostel near Kirinyaga University",
            createdAt: "2026-03-27T10:00:00.000Z",
          },
          {
            id: "m2",
            role: "assistant",
            content: "I can help you filter by city, price, or proximity.",
            createdAt: "2026-03-27T10:00:05.000Z",
          },
        ],
      })
    );

    render(<Chatbot />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:5100/api/chatbot/sessions/session-123",
        expect.objectContaining({ method: "GET" })
      );
    });

    await userEvent.click(screen.getByRole("button", { name: "Open Chat" }));

    expect(await screen.findByText("Need a hostel near Kirinyaga University")).toBeInTheDocument();
    expect(screen.getByText("I can help you filter by city, price, or proximity.")).toBeInTheDocument();
  });

  it("sends a real chatbot request and renders backend suggestions", async () => {
    mockUser = {
      id: "student-1",
      username: "Student One",
      email: "student@example.com",
      role: "student",
    };

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        sessionId: "session-456",
        reply: "You can start by filtering approved hostels near Kirinyaga University.",
        model: "gemini-2.5-flash",
        provider: "gemini",
        usedStub: false,
        usedFallback: false,
        sources: ["live_platform_snapshot", "hostel_search"],
        suggestions: ["Filter hostels by city and price", "How does proximity search work?"],
      })
    );

    render(<Chatbot />);

    await userEvent.click(screen.getByRole("button", { name: "Open Chat" }));
    expect(screen.getByText(/Show my recent booking guidance/i)).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Ask about hostels, payments, bookings...");
    fireEvent.change(input, { target: { value: "Show me hostels near Kirinyaga University" } });
    expect(input).toHaveValue("Show me hostels near Kirinyaga University");
    await userEvent.click(screen.getByRole("button", { name: "Send Message" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:5100/api/chatbot/message");
    expect(request?.method).toBe("POST");

    const payload = JSON.parse(String(request?.body));
    expect(payload.message).toBe("Show me hostels near Kirinyaga University");
    expect(payload.user).toEqual({ id: "student-1", role: "student" });
    expect(payload.context.primaryUniversity).toBe("Kirinyaga University");

    expect(await screen.findByText("You can start by filtering approved hostels near Kirinyaga University.")).toBeInTheDocument();
    expect(screen.getByText("Filter hostels by city and price")).toBeInTheDocument();
    expect(screen.getByText("Grounded reply")).toBeInTheDocument();
    expect(screen.getByText("Based on live platform data, hostel search.")).toBeInTheDocument();
    expect(localStorage.getItem("shf_chatbot_session_id")).toBe("session-456");
  });

  it("shows a safe fallback message when the backend returns an error", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { message: "Chatbot service timed out." },
        { status: 504 }
      )
    );

    render(<Chatbot />);

    await userEvent.click(screen.getByRole("button", { name: "Open Chat" }));
    const input = screen.getByPlaceholderText("Ask about hostels, payments, bookings...");
    fireEvent.change(input, { target: { value: "How do I pay with M-Pesa?" } });
    expect(input).toHaveValue("How do I pay with M-Pesa?");
    await userEvent.click(screen.getByRole("button", { name: "Send Message" }));

    expect(await screen.findByText("I couldn't complete that request right now.")).toBeInTheDocument();
    expect(screen.getByText("Chatbot service timed out.")).toBeInTheDocument();
  });

  it("renders fallback status when the chatbot explicitly marks a response as fallback guidance", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        sessionId: "session-999",
        reply: "I can help with booking guidance.",
        model: "gemini-2.5-flash",
        provider: "gemini-fallback",
        usedStub: false,
        usedFallback: true,
        fallbackReason: "provider_error",
        sources: ["live_student_context", "recent_bookings"],
        suggestions: ["Show my recent booking guidance"],
      })
    );

    render(<Chatbot />);

    await userEvent.click(screen.getByRole("button", { name: "Open Chat" }));
    const input = screen.getByPlaceholderText("Ask about hostels, payments, bookings...");
    fireEvent.change(input, { target: { value: "Show my recent booking guidance" } });
    await userEvent.click(screen.getByRole("button", { name: "Send Message" }));

    expect(await screen.findByText("I can help with booking guidance.")).toBeInTheDocument();
    expect(screen.getByText("Fallback guidance")).toBeInTheDocument();
    expect(screen.getByText("provider error")).toBeInTheDocument();
    expect(screen.getByText("Based on your student context, your bookings.")).toBeInTheDocument();
  });

  it("copies a chatbot response to the clipboard", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        sessionId: "session-copy",
        reply: "Riverside Executive Suites currently has 5 rooms available.",
        model: "gemini-2.5-flash",
        provider: "context-direct",
        usedStub: false,
        suggestions: [],
      })
    );
    writeTextMock.mockResolvedValueOnce();

    render(<Chatbot />);

    await userEvent.click(screen.getByRole("button", { name: "Open Chat" }));
    const input = screen.getByPlaceholderText("Ask about hostels, payments, bookings...");
    fireEvent.change(input, { target: { value: "Are there rooms available at Riverside Executive Suites?" } });
    await userEvent.click(screen.getByRole("button", { name: "Send Message" }));

    expect(await screen.findByText("Riverside Executive Suites currently has 5 rooms available.")).toBeInTheDocument();

    const copyButtons = screen.getAllByRole("button", { name: /Copy .* message/i });
    await userEvent.click(copyButtons[copyButtons.length - 1]);

    expect(writeTextMock).toHaveBeenCalledWith("Riverside Executive Suites currently has 5 rooms available.");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("lets the user edit a previous prompt and resend it as a fresh branch", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          sessionId: "session-edit-1",
          reply: "Here are hostels near Kirinyaga University.",
          model: "gemini-2.5-flash",
          provider: "context-direct",
          usedStub: false,
          suggestions: [],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          sessionId: "session-edit-2",
          reply: "Here are hostels in Kerugoya.",
          model: "gemini-2.5-flash",
          provider: "context-direct",
          usedStub: false,
          suggestions: [],
        })
      );

    render(<Chatbot />);

    await userEvent.click(screen.getByRole("button", { name: "Open Chat" }));
    const input = screen.getByPlaceholderText("Ask about hostels, payments, bookings...");
    fireEvent.change(input, { target: { value: "Show hostels near Kirinyaga University" } });
    await userEvent.click(screen.getByRole("button", { name: "Send Message" }));

    expect(await screen.findByText("Here are hostels near Kirinyaga University.")).toBeInTheDocument();

    const editButtons = screen.getAllByRole("button", { name: "Edit prompt" });
    await userEvent.click(editButtons[editButtons.length - 1]);

    const editingInput = screen.getByPlaceholderText("Ask about hostels, payments, bookings...");
    expect(editingInput).toHaveValue("Show hostels near Kirinyaga University");

    fireEvent.change(editingInput, { target: { value: "Show hostels in Kerugoya" } });
    await userEvent.click(screen.getByRole("button", { name: "Save Prompt Edit" }));

    expect(await screen.findByText("Here are hostels in Kerugoya.")).toBeInTheDocument();
    expect(screen.queryByText("Here are hostels near Kirinyaga University.")).not.toBeInTheDocument();

    const firstPayload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const secondPayload = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));

    expect(firstPayload.sessionId).toBeNull();
    expect(secondPayload.sessionId).toBeNull();
    expect(secondPayload.message).toBe("Show hostels in Kerugoya");
    expect(secondPayload.history).toEqual([
      expect.objectContaining({
        role: "assistant",
        content: expect.stringContaining("Smart Hostel Finder assistant"),
      }),
    ]);
    expect(localStorage.getItem("shf_chatbot_session_id")).toBe("session-edit-2");
  });
});
