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
  console.log('toggle: ', value);
  layoutStore.setState((prevState) => ({
    ...prevState,
    sidebar: {
      isClosed: value === undefined ? !prevState.sidebar.isClosed : value,
    },
  }));
};
