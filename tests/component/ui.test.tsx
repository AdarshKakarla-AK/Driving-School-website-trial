import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, Badge, Stars, ProgressBar, Tabs, Avatar, Stat, Input } from "@/components/ui";

describe("ui components", () => {
  it("Button renders children and disables while loading", () => {
    const { rerender } = render(<Button>Book Now</Button>);
    const btn = screen.getByRole("button", { name: "Book Now" });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();

    rerender(<Button loading>Book Now</Button>);
    expect(screen.getByRole("button", { name: "Book Now" })).toBeDisabled();
  });

  it("Badge applies its tone and shows children", () => {
    render(<Badge tone="green">Active</Badge>);
    expect(screen.getByText("Active")).toHaveClass("bg-go-500/15");
  });

  it("Stars fills the correct number of stars", () => {
    const full = render(<Stars rating={3} />);
    expect(full.container.querySelectorAll('span[style*="width: 100%"]')).toHaveLength(3);

    const half = render(<Stars rating={4.5} />);
    expect(half.container.querySelectorAll('span[style*="width: 100%"]')).toHaveLength(4);
    expect(half.container.querySelectorAll('span[style*="width: 50%"]')).toHaveLength(1);
  });

  it("ProgressBar clamps its width between 0% and 100%", () => {
    const over = render(<ProgressBar value={150} />);
    expect(over.container.querySelector("div[style*='width']")).toHaveAttribute("style", expect.stringContaining("100%"));
    const under = render(<ProgressBar value={-20} />);
    expect(under.container.querySelector("div[style*='width']")).toHaveAttribute("style", expect.stringContaining("0%"));
  });

  it("Tabs calls onChange with the selected tab id", () => {
    const onChange = vi.fn();
    render(
      <Tabs
        tabs={[
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ]}
        active="a"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("Avatar renders initials", () => {
    render(<Avatar name="Rahul Sharma" />);
    expect(screen.getByText("RS")).toBeInTheDocument();
  });

  it("Stat shows label and value", () => {
    render(<Stat label="Revenue" value="₹1,00,000" />);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("₹1,00,000")).toBeInTheDocument();
  });

  it("Input renders a labelled field", () => {
    render(<Input label="Full Name" />);
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
  });
});
