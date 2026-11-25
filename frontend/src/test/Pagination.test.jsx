import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Pagination from "../components/Pagination";

describe("Pagination", () => {
  it("shows the range and moves between pages", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageSize={10} count={25} onPageChange={onPageChange} />);
    expect(screen.getByText("Showing 11–20 of 25")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Next/));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables Prev on the first page and renders nothing when empty", () => {
    const { rerender, container } = render(<Pagination page={1} pageSize={10} count={5} onPageChange={() => {}} />);
    expect(screen.getByText(/Prev/)).toBeDisabled();
    rerender(<Pagination page={1} pageSize={10} count={0} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
