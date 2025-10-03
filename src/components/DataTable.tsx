import React, { ReactNode, useEffect, useRef } from "react";
import { Table, Text, Loader, UnstyledButton, Group } from "@mantine/core";
import { IconChevronUp, IconChevronDown } from "@tabler/icons-react";

export interface DataTableColumn<T> {
  key: keyof T | string;
  title: string | ReactNode;
  render?: (item: T) => ReactNode;
  width?: number;
  sortable?: boolean;
  sortKey?: string;
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  stickyHeader?: boolean;
  height?: number | string;
  noDataMessage?: ReactNode;
  horizontalScroll?: boolean;
  minWidth?: number | string;

  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (sortBy: string, sortDirection: "asc" | "desc") => void;

  getRowStyle?: (item: T) => React.CSSProperties;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  hasMore = false,
  onLoadMore,
  emptyMessage = "No data available",
  stickyHeader = false,
  height = "auto",
  noDataMessage,
  horizontalScroll = false,
  minWidth = "auto",
  sortBy,
  sortDirection,
  onSort,
  getRowStyle,
  onRowClick,
}: DataTableProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSort) return;

    const columnSortKey = column.sortKey || String(column.key);

    let newDirection: "asc" | "desc" = "asc";
    if (sortBy === columnSortKey && sortDirection === "asc") {
      newDirection = "desc";
    }

    onSort(columnSortKey, newDirection);
  };

  const getSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null;

    const columnSortKey = column.sortKey || String(column.key);
    const isActive = sortBy === columnSortKey;

    if (!isActive) {
      return (
        <IconChevronUp
          size={16}
          style={{ opacity: 0.6, color: "var(--mantine-color-gray-6)" }}
        />
      );
    }

    return sortDirection === "asc" ? (
      <IconChevronUp
        size={16}
        style={{ color: "var(--mantine-color-blue-6)" }}
      />
    ) : (
      <IconChevronDown
        size={16}
        style={{ color: "var(--mantine-color-blue-6)" }}
      />
    );
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || loading || !onLoadMore) return;

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const threshold = 100;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      onLoadMore();
    }
  };

  useEffect(() => {
    if (!hasMore || loading || !onLoadMore || data.length === 0) return;

    const checkAndLoadMore = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollHeight, clientHeight } = container;

      if (scrollHeight <= clientHeight) {
        const timeoutId = setTimeout(() => {
          onLoadMore();
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    };

    const timeoutId = setTimeout(checkAndLoadMore, 50);
    return () => clearTimeout(timeoutId);
  }, [data.length, hasMore, loading, onLoadMore]);

  const renderCell = (item: T, column: DataTableColumn<T>) => {
    if (column.render) {
      return column.render(item);
    }

    const value = item[column.key as keyof T];
    return value?.toString() || "";
  };

  const isEmpty = data.length === 0 && !loading;

  return (
    <div
      ref={scrollContainerRef}
      className={horizontalScroll ? "datatable-horizontal-scroll" : ""}
      style={{
        height,
        overflow: "auto",
        borderRadius: "var(--mantine-radius-default)",
        position: "relative",
      }}
      onScroll={handleScroll}
    >
      <Table
        withRowBorders={false}
        stickyHeader={stickyHeader}
        striped
        stripedColor="#f9f9f9"
        style={{
          minWidth: horizontalScroll ? minWidth : undefined,
          tableLayout: "fixed",
          width: "100%",
          borderRadius: "var(--mantine-radius-default)",
        }}
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((column, index) => (
              <Table.Th
                key={index}
                style={{
                  ...(column.width
                    ? { width: column.width, maxWidth: column.width }
                    : {}),
                  whiteSpace: "nowrap",
                  wordWrap: "break-word",
                  overflow: "hidden",
                  padding: 0,
                  textAlign: column.headerAlign || "left",
                }}
              >
                {column.sortable ? (
                  <UnstyledButton
                    onClick={() => handleSort(column)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      textAlign: column.headerAlign || "left",
                      display: "block",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "var(--mantine-color-gray-1)",
                      },
                    }}
                  >
                    <Group
                      justify={
                        column.headerAlign === "center"
                          ? "center"
                          : column.headerAlign === "right"
                          ? "flex-end"
                          : "space-between"
                      }
                      wrap="nowrap"
                      gap="sm"
                      align="center"
                    >
                      {typeof column.title === "string" ? (
                        <Text size="sm" fw={500}>
                          {column.title}
                        </Text>
                      ) : (
                        column.title
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "16px",
                          height: "16px",
                        }}
                      >
                        {getSortIcon(column)}
                      </div>
                    </Group>
                  </UnstyledButton>
                ) : (
                  <div
                    style={{
                      padding: "8px 12px",
                      textAlign: column.headerAlign || "left",
                    }}
                  >
                    {typeof column.title === "string" ? (
                      <Text size="sm" fw={500}>
                        {column.title}
                      </Text>
                    ) : (
                      column.title
                    )}
                  </div>
                )}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isEmpty ? (
            <Table.Tr>
              <Table.Td
                colSpan={columns.length}
                style={{ textAlign: "center", padding: "48px" }}
              >
                {noDataMessage || (
                  <Text c="dimmed" component="div">
                    {emptyMessage}
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ) : (
            data.map((item, rowIndex) => (
              <Table.Tr
                key={rowIndex}
                style={{
                  ...(getRowStyle ? getRowStyle(item) : {}),
                  ...(onRowClick ? { cursor: "pointer" } : {}),
                }}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column, colIndex) => (
                  <Table.Td
                    key={colIndex}
                    style={{
                      ...(columns[colIndex].width
                        ? {
                            width: columns[colIndex].width,
                            maxWidth: columns[colIndex].width,
                          }
                        : {}),
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      overflow: "hidden",
                      verticalAlign: "top",
                      textAlign: columns[colIndex].align || "left",
                    }}
                  >
                    {renderCell(item, column)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      {/* Loading indicator at bottom */}
      {loading && data.length > 0 && (
        <div style={{ padding: "16px", textAlign: "center" }}>
          <Loader
            size="sm"
            style={{ display: "inline-block", marginRight: "8px" }}
          />
          <Text size="sm" c="dimmed" component="span">
            Loading more items...
          </Text>
        </div>
      )}
    </div>
  );
}
