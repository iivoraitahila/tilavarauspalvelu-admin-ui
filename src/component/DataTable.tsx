import React, { useState } from "react";
import styled from "styled-components";
import {
  Button,
  IconArrowDown,
  IconArrowUp,
  IconEye,
  IconEyeCrossed,
  IconSliders,
} from "hds-react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import orderBy from "lodash/orderBy";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import classNames from "classnames";
import FilterControls from "./FilterControls";
import {
  Application as ApplicationType,
  DataFilterConfig,
  DataFilterOption,
  DataGroup,
} from "../common/types";
import RecommendationDataTableGroup from "./ApplicationRound/RecommendationDataTableGroup";
import {
  breakpoints,
  getGridFraction,
  SelectionCheckbox,
} from "../styles/util";
import { ReactComponent as IconOpenAll } from "../images/icon_open-all.svg";
import { ReactComponent as IconActivateSelection } from "../images/icon_select.svg";
import { ReactComponent as IconDisableSelection } from "../images/icon_unselect.svg";
import { truncatedText } from "../styles/typography";

type DataType = ApplicationType;

type OrderTypes = "asc" | "desc";

interface Column {
  title: string;
  key: string;
  transform?: ({ status }: DataType) => string | JSX.Element;
}

interface GeneralConfig {
  filtering?: boolean;
  rowFilters?: boolean;
  hideHandled?: boolean;
  selection?: boolean;
}

export interface CellConfig {
  cols: Column[];
  index: string;
  sorting: string;
  order: OrderTypes;
  rowLink?: ({ id }: DataType) => string;
}

interface IProps {
  groups: DataGroup[];
  hasGrouping: boolean;
  config: GeneralConfig;
  cellConfig: CellConfig;
  filterConfig: DataFilterConfig[];
  className?: string;
}

interface IToggleableButton {
  $isActive: boolean;
}

const Wrapper = styled.div``;

const Filters = styled.div`
  & > button {
    margin-right: var(--spacing-m);

    svg {
      display: none;

      @media (min-width: ${breakpoints.s}) {
        display: inline;
        min-width: 20px;
      }
    }
  }

  background-color: var(--tilavaraus-admin-gray);
  padding: 0 var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 56px;
  position: relative;
`;

interface IFilterBtn {
  $filterControlsAreOpen: boolean;
  $filtersActive: boolean;
}

const FilterBtn = styled(Button).attrs(
  ({ $filterControlsAreOpen, $filtersActive }: IFilterBtn) => ({
    style: {
      "--filter-button-color": $filtersActive
        ? "var(--tilavaraus-admin-blue-dark)"
        : $filterControlsAreOpen
        ? "var(--color-silver)"
        : "transparent",
      "--color-bus": "var(--filter-button-color)",
      "--color-bus-dark": "var(--filter-button-color)",
      "--color-white": $filtersActive
        ? "white"
        : "var(--tilavaraus-admin-content-text-color)",
      "--background-color-disabled": "transparent",
      "--border-color-disabled": "transparent",
      "--color-disabled": "var(--color-black-50)",
    } as React.CSSProperties,
  })
)<IFilterBtn>`
  ${({ $filtersActive }) =>
    $filtersActive &&
    `
    font-family: var(--tilavaraus-admin-font-bold);
    font-weight: bold;
  `}
`;

const tableBorder = (size = "0.5em"): string =>
  `${size} solid var(--tilavaraus-admin-gray)`;

const TableWrapper = styled.div`
  &:after {
    content: "";
    position: absolute;
    top: calc(var(--spacing-4-xl) - 12px);
    left: 0;
    right: 0;
    width: 100%;
    height: 12px;
    box-shadow: 0px 12px 16px 0 rgba(0, 0, 0, 0.13);
    z-index: 1;
  }

  position: relative;
  overflow-x: auto;
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  min-width: var(--breakpoint-m);
  padding: 0 var(--spacing-m);
  border-spacing: 0;

  @media (min-width: ${breakpoints.m}) {
    min-width: auto;
  }

  @media (min-width: ${breakpoints.xl}) {
    padding-right: ${getGridFraction(1)}%;
  }
`;

const Cell = styled.td`
  &:after {
    content: "";
    position: absolute;
    top: 1rem;
    right: 0;
    width: 1px;
    height: 2rem;
    background-color: #dadada;
  }

  &:first-of-type {
    padding-left: var(--spacing-m);
  }

  &:last-of-type {
    &:after {
      display: none;
    }

    border-right: 0 none;
  }

  ${truncatedText}
  position: relative;
  height: var(--spacing-4-xl);
  padding: 0 var(--spacing-l) 0 var(--spacing-xs);
  user-select: none;
`;

export const Row = styled.tr<{ $clickable?: boolean }>`
  ${({ $clickable }) => $clickable && "cursor: pointer;"}
`;

export const Heading = styled.thead`
  ${Cell} {
    &:first-of-type {
      padding-left: calc(0.5em + var(--spacing-m));
    }

    &.sortingActive {
      svg {
        position: absolute;
        top: 1.2em;
        transform: scale(0.7);
      }
    }

    ${truncatedText}
    font-weight: normal;
    text-align: left;
    user-select: none;
    cursor: pointer;
  }
`;

const Body = styled.tbody`
  ${Row} {
    &:hover {
      ${Cell} {
        background-color: var(--color-silver-light);
      }
    }
    &:first-of-type {
      ${Cell} {
        &:first-of-type {
          border-left: ${tableBorder()};
        }

        &:last-of-type {
          border-right: ${tableBorder()};
        }

        border-top: ${tableBorder("0.3em")};
      }
    }

    &:last-of-type {
      ${Cell} {
        &:first-of-type {
          border-left: ${tableBorder()};
        }

        &:last-of-type {
          border-right: ${tableBorder()};
        }
        border-bottom: ${tableBorder()};
      }
    }

    ${Cell} {
      &:first-of-type {
        border-left: ${tableBorder()};
      }
      &:last-of-type {
        border-right: ${tableBorder()};
      }

      border-bottom: ${tableBorder("0.3em")};
    }

    font-size: var(--fontsize-body-s);
  }
`;

const HideHandledBtn = styled(Button).attrs(
  ({ $isActive }: IToggleableButton) => ({
    iconLeft: $isActive ? <IconEye /> : <IconEyeCrossed />,
    style: {
      "--filter-button-color": "transparent",
      "--color-bus": "var(--filter-button-color)",
      "--color-bus-dark": "var(--filter-button-color)",
      "--color-white": "var(--tilavaraus-admin-content-text-color)",
      "--background-color-disabled": "transparent",
      "--border-color-disabled": "transparent",
      "--color-disabled": "var(--color-black-50)",
    } as React.CSSProperties,
  })
)<IToggleableButton>``;

const ToggleVisibilityBtn = styled(Button).attrs({
  iconLeft: <IconOpenAll />,
  style: {
    "--filter-button-color": "transparent",
    "--color-bus": "var(--filter-button-color)",
    "--color-bus-dark": "var(--filter-button-color)",
    "--color-white": "var(--tilavaraus-admin-content-text-color)",
  } as React.CSSProperties,
})<IToggleableButton>`
  svg {
    ${({ $isActive }): string | false =>
      $isActive && "transform: rotate(180deg);"}
  }

  @media (min-width: ${breakpoints.xl}) {
    position: absolute;
    right: 6%;
  }
`;

const SelectionToggleBtn = styled(Button).attrs(
  ({ $isActive }: IToggleableButton) => ({
    iconLeft: $isActive ? <IconDisableSelection /> : <IconActivateSelection />,
    style: {
      "--filter-button-color": "transparent",
      "--color-bus": "var(--filter-button-color)",
      "--color-bus-dark": "var(--filter-button-color)",
      "--color-white": "var(--tilavaraus-admin-content-text-color)",
    } as React.CSSProperties,
  })
)<IToggleableButton>``;

const SelectionCell = styled(Cell)`
  &:after {
    content: none;
  }

  padding-right: var(--spacing-3-xs);
  width: calc(0.5em + var(--spacing-m));
  min-width: calc(0.5em + var(--spacing-m));
  overflow-x: visible !important;
  border-bottom: ${tableBorder()};
  border-left: ${tableBorder()};

  @media (min-width: ${breakpoints.l}) {
    width: var(--spacing-m);
    min-width: var(--spacing-m);
  }
`;

const HeadingSelectionCell = styled(SelectionCell)`
  border: 0;
`;

interface SortingProps {
  direction: OrderTypes;
}

function SortingArrow({ direction }: SortingProps): JSX.Element {
  return direction === "asc" ? <IconArrowDown /> : <IconArrowUp />;
}

const processData = (
  groups: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  sorting: string,
  order: "asc" | "desc",
  filters: DataFilterOption[],
  handledAreHidden: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] => {
  return groups.map((group) => {
    let data;
    if (filters.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filteredData = group.applications.filter((row: any): boolean => {
        return (
          filters.filter(
            (filter): boolean => get(row, filter.key) === filter.value
          ).length === filters.length
        );
      });

      data = filteredData;
    } else {
      data = group.applications;
    }

    if (handledAreHidden) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data = data.filter((row: any): boolean => row.status !== "validated");
    }

    return {
      ...group,
      applications: orderBy(data, [sorting], [order]),
    };
  });
};

function DataTable({
  groups,
  hasGrouping,
  config = {
    filtering: false,
    rowFilters: false,
    hideHandled: false,
    selection: false,
  },
  cellConfig,
  filterConfig,
  className,
}: IProps): JSX.Element {
  const [sorting, setSorting] = useState<string>(cellConfig.sorting);
  const [order, setOrder] = useState<OrderTypes>(cellConfig.order);
  const [filtersAreVisible, toggleFilterVisibility] = useState(false);
  const [filters, setFilters] = useState<DataFilterOption[]>([]);
  const [handledAreHidden, toggleHideHandled] = useState<boolean>(false);
  const [groupVisibility, setGroupVisibility] = useState<boolean[]>(
    groups.map(() => true)
  );
  const [isSelectionActive, toggleSelectionActivity] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const setSortingAndOrder = (colKey: string): void => {
    if (sorting === colKey) {
      setOrder(order === "desc" ? "asc" : "desc");
    } else {
      setOrder("asc");
    }
    setSorting(colKey);
  };

  const { t } = useTranslation();
  const history = useHistory();

  const processedData = processData(
    groups,
    sorting,
    order,
    filters,
    handledAreHidden
  );
  const sortingEnabled: boolean = processedData.length > 0;

  const filterSomeGroupsAreHidden: boolean = groupVisibility.some(
    (visibility): boolean => !visibility
  );

  const toggleGroupVisibility = (forceOpen = false): void => {
    const shouldOpen = forceOpen || filterSomeGroupsAreHidden;
    setGroupVisibility(groups.map((): boolean => shouldOpen));
  };

  const updateSelection = (
    selection: number[],
    method?: "add" | "remove"
  ): void => {
    let result: number[];
    if (method) {
      result =
        method === "add"
          ? [...selectedRows, ...selection]
          : [...selectedRows.filter((row) => !selection.includes(row))];
    } else {
      result = selection;
    }

    setSelectedRows(result.sort((a, b) => a - b));
  };

  const getRowIds = (group?: number): number[] => {
    return group
      ? processedData
          .find((data) => data.id === group)
          .applications.map((data: any) => data.id) // eslint-disable-line @typescript-eslint/no-explicit-any
      : processedData.flatMap(
          (data) => data.applications.map((application: any) => application.id) // eslint-disable-line @typescript-eslint/no-explicit-any
        );
  };

  const areAllRowsSelected: boolean = isEqual(selectedRows, getRowIds());

  return (
    <Wrapper className={className}>
      {config.filtering && (
        <Filters>
          {config.rowFilters && (
            <>
              <FilterBtn
                data-testid="data-table__button--filter-toggle"
                iconLeft={<IconSliders />}
                onClick={(): void => toggleFilterVisibility(!filtersAreVisible)}
                className={classNames({
                  filterControlsAreOpen: filtersAreVisible,
                })}
                $filterControlsAreOpen={filtersAreVisible}
                $filtersActive={filters.length > 0}
                disabled={
                  (filterConfig && filterConfig.length < 1) || isSelectionActive
                }
              >
                {t(
                  `${filters.length > 0 ? "common.filtered" : "common.filter"}`
                )}
              </FilterBtn>
              <FilterControls
                filters={filters}
                visible={filtersAreVisible}
                applyFilters={setFilters}
                config={filterConfig}
              />
            </>
          )}
          {config.hideHandled && (
            <HideHandledBtn
              onClick={(): void => toggleHideHandled(!handledAreHidden)}
              disabled={isSelectionActive}
              $isActive={handledAreHidden}
            >
              {t(
                `common.${
                  handledAreHidden ? "filterShowHandled" : "filterHideHandled"
                }`
              )}
            </HideHandledBtn>
          )}
          {config.selection && (
            <SelectionToggleBtn
              onClick={(): void => {
                if (!isSelectionActive) {
                  toggleGroupVisibility(true);
                }
                toggleSelectionActivity(!isSelectionActive);
              }}
              $isActive={isSelectionActive}
            >
              {t(
                `common.${
                  isSelectionActive ? "disableSelection" : "activateSelection"
                }`
              )}
            </SelectionToggleBtn>
          )}
          {hasGrouping && (
            <ToggleVisibilityBtn
              onClick={(): void => {
                toggleGroupVisibility();
              }}
              $isActive={!filterSomeGroupsAreHidden}
            >
              {t(
                `common.${filterSomeGroupsAreHidden ? "openAll" : "closeAll"}`
              )}
            </ToggleVisibilityBtn>
          )}
        </Filters>
      )}
      <TableWrapper>
        <Table data-testid="data-table">
          <Heading>
            <Row>
              {isSelectionActive && (
                <HeadingSelectionCell as="th">
                  <SelectionCheckbox
                    id="recommendation-all-checkbox"
                    onChange={(e) => {
                      updateSelection(e.target.checked ? getRowIds() : []);
                    }}
                    checked={areAllRowsSelected}
                    aria-label={t(
                      `common.${
                        areAllRowsSelected ? "deselectAllRows" : "selectAllRows"
                      }`
                    )}
                  />
                </HeadingSelectionCell>
              )}
              {cellConfig.cols.map(
                (col): JSX.Element => {
                  const sortingActive = sortingEnabled && col.key === sorting;
                  const title = t(col.title);
                  return (
                    <Cell
                      as="th"
                      key={col.key}
                      onClick={(): void | false =>
                        sortingEnabled && setSortingAndOrder(col.key)
                      }
                      className={classNames({ sortingActive })}
                      title={title}
                    >
                      <span>{title}</span>
                      {sortingActive && <SortingArrow direction={order} />}
                    </Cell>
                  );
                }
              )}
            </Row>
          </Heading>
          <Body>
            {groups.length > 0 ? (
              processedData.map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (group: any, groupIndex: number): JSX.Element => {
                  return (
                    <RecommendationDataTableGroup
                      group={group}
                      hasGrouping={hasGrouping}
                      key={group.id || "group"}
                      cols={cellConfig.cols.length}
                      index={groupIndex}
                      isVisible={groupVisibility[groupIndex]}
                      toggleGroupVisibility={(): void => {
                        const tempGroupVisibility = [...groupVisibility];
                        tempGroupVisibility[groupIndex] = !tempGroupVisibility[
                          groupIndex
                        ];
                        setGroupVisibility(tempGroupVisibility);
                      }}
                      isSelectionActive={isSelectionActive}
                      isSelected={getRowIds(group.id).every((id) =>
                        selectedRows.includes(id)
                      )}
                      toggleSelection={updateSelection}
                      getRowIds={getRowIds}
                    >
                      {group.applications.map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (row: any): JSX.Element => {
                          const rowKey = `${sorting}${order}${get(
                            row,
                            cellConfig.index
                          )}`;
                          const rowId: number = get(row, cellConfig.index);

                          return (
                            <Row
                              key={rowKey}
                              onClick={(): void => {
                                if (isSelectionActive) {
                                  updateSelection(
                                    [rowId],
                                    selectedRows.includes(rowId)
                                      ? "remove"
                                      : "add"
                                  );
                                } else if (cellConfig.rowLink) {
                                  const link: string = cellConfig.rowLink(row);
                                  history.push(link);
                                }
                              }}
                              $clickable={!!cellConfig.rowLink}
                            >
                              {isSelectionActive && (
                                <SelectionCell>
                                  <SelectionCheckbox
                                    id={`recommendation-row-checkbox-${get(
                                      row,
                                      cellConfig.index
                                    )}`}
                                    onChange={(e) => {
                                      updateSelection(
                                        [rowId],
                                        e.target.checked ? "add" : "remove"
                                      );
                                    }}
                                    checked={selectedRows.includes(rowId)}
                                    aria-label={t(
                                      `common.${
                                        selectedRows.includes(rowId)
                                          ? "deselectRowX"
                                          : "selectRowX"
                                      }`,
                                      {
                                        row: rowId,
                                      }
                                    )}
                                  />
                                </SelectionCell>
                              )}
                              {cellConfig.cols.map(
                                (col: Column): JSX.Element => {
                                  const colKey = `${rowKey}${col.key}`;
                                  const value = col.transform
                                    ? col.transform(row)
                                    : get(row, col.key);
                                  return <Cell key={colKey}>{value}</Cell>;
                                }
                              )}
                            </Row>
                          );
                        }
                      )}
                    </RecommendationDataTableGroup>
                  );
                }
              )
            ) : (
              <Row>
                <Cell colSpan={cellConfig.cols.length}>
                  {t("common.noResults")}
                </Cell>
              </Row>
            )}
          </Body>
        </Table>
      </TableWrapper>
    </Wrapper>
  );
}

export default DataTable;
