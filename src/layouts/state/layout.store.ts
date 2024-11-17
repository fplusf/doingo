import { Store } from '@tanstack/react-store';

export type LayoutState = {
  sidebar: {
    open: boolean;
  };
};

export const layoutStore = new Store<LayoutState>({
  sidebar: {
    open: false,
  },
});

export const toggleSidebarState = (value?: boolean) => {
  layoutStore.setState((prevState) => ({
    ...prevState,
    sidebar: {
      open: value === undefined ? !prevState.sidebar.open : value,
    },
  }));
};
