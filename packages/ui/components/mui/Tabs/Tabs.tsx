// packages/ui/components/mui/Tabs/Tabs.tsx
import React from "react";
import {
  Tabs as MuiTabs,
  Tab as MuiTab,
  Box,
  TabsProps as MuiTabsProps,
} from "@mui/material";

export interface TabItem {
  /**
   * Label tekst for tab
   */
  label: string;

  /**
   * Unik værdi for tab
   */
  value: string;

  /**
   * Om tab er deaktiveret
   * @default false
   */
  disabled?: boolean;

  /**
   * Ikon til visning i tab
   */
  icon?: React.ReactElement | string;
}

export interface TabsProps extends Omit<MuiTabsProps, "onChange"> {
  /**
   * Array af tab-elementer
   */
  items: TabItem[];

  /**
   * Aktiv tab-værdi
   */
  value: string;

  /**
   * Callback når tab ændres
   */
  onChange: (value: string) => void;

  /**
   * Orientering af tabs
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";

  /**
   * Variant af tabs
   * @default 'standard'
   */
  variant?: "standard" | "scrollable" | "fullWidth";
}

/**
 * Tabs-komponent til navigation mellem relateret indhold
 */
export const Tabs = ({
  items,
  value,
  onChange,
  orientation = "horizontal",
  variant = "standard",
  ...props
}: TabsProps) => {
  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    onChange(newValue);
  };

  return (
    <MuiTabs
      value={value}
      onChange={handleChange}
      orientation={orientation}
      variant={variant}
      {...props}
    >
      {items.map((item) => (
        <MuiTab
          key={item.value}
          label={item.label}
          value={item.value}
          disabled={item.disabled}
          icon={
            item.icon
              ? React.createElement(React.Fragment, null, item.icon)
              : undefined
          }
          iconPosition="start"
        />
      ))}
    </MuiTabs>
  );
};

export interface TabPanelProps {
  /**
   * Indhold i tab panel
   */
  children?: React.ReactNode;

  /**
   * Aktiv tab-værdi
   */
  value: string;

  /**
   * Tab-værdi for dette panel
   */
  tabValue: string;
}

/**
 * TabPanel-komponent til at vise indhold for en specifik tab
 */
export const TabPanel = ({ children, value, tabValue }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== tabValue}
      id={`tabpanel-${tabValue}`}
      aria-labelledby={`tab-${tabValue}`}
    >
      {value === tabValue && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};
