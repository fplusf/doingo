import { Store } from '@tanstack/react-store';

export type LayoutState = {
  sidebar: {
    isClosed: boolean;
  };
};

export const layoutStore = new Store<LayoutState>({
  sidebar: {
    isClosed: true,
  },
});

export const toggleSidebarState = (value?: boolean) => {
  // Always keep sidebar closed
  layoutStore.setState((prevState) => ({
    ...prevState,
    sidebar: {
      isClosed: true,
    },
  }));
};
