import DragWindowRegion from '@/components/DragWindowRegion';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import {
  TopSidebarTrigger,
  TopSidebarTriggerVisible,
} from '@/components/sidebar/left-sidebar-trigger';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useRouter } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { DatePicker } from '@/components/calendar/header-calendar';
import { Button } from '@/components/ui/button';
import { useWeekNavigation } from '../hooks/use-week-navigation';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  const { state } = useRouter();
  const date = state.location.search.date || new Date().toISOString().split('T')[0];
  const { handleNext, handlePrev, navigateToDate } = useWeekNavigation();

  return (
    <div className="flex h-screen flex-col">
      <DragWindowRegion>
        {{
          left: (
            <>
              <TopSidebarTriggerVisible />
              <div className="ml-12 flex max-w-max">
                <div className="flex items-center justify-center">
                  <Button onClick={handlePrev} variant="ghost" size="icon" className="h-7 w-7">
                    <ChevronLeft />
                  </Button>
                  {/* Navigate to Today when clicked on the Month label */}
                  <span
                    onClick={() => {
                      navigateToDate(new Date());
                    }}
                    className="mx-2 w-[127px] cursor-pointer text-center"
                  >
                    {format(new Date(date), 'MMMM yyyy')}
                  </span>
                  <Button onClick={handleNext} variant="ghost" size="icon" className="h-7 w-7">
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </>
          ),
          right: (
            <div className="mr-2 py-2">
              <DatePicker />
            </div>
          ),
        }}
      </DragWindowRegion>

      <div className="relative flex flex-1">
        <SidebarProvider style={{ '--sidebar-width': '5rem' } as any}>
          <AppSidebar />
          <SidebarInset>
            <TopSidebarTrigger />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
