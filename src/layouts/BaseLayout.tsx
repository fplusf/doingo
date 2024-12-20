import DragWindowRegion from '@/components/DragWindowRegion';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import {
  TopSidebarTrigger,
  TopSidebarTriggerVisible,
} from '@/components/sidebar/left-sidebar-trigger';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { DatePicker } from '@/components/calendar/header-calendar';
import { Button } from '@/components/ui/button';
import { useWeekNavigation } from '../hooks/use-week-navigation';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  const search = useSearch({ from: '/' });
  const { handleNext, handlePrev } = useWeekNavigation();

  return (
    <div className="flex h-screen flex-col">
      <DragWindowRegion>
        {{
          left: (
            <>
              <TopSidebarTriggerVisible />
              <div className="ml-12 flex max-w-max">
                {/* Today, 18 Nov <span className="font-semibold text-green-600">&nbsp;2024</span> */}

                <div className="flex items-center justify-center">
                  <Button onClick={handlePrev} variant="ghost" size="icon" className="h-7 w-7">
                    <ChevronLeft />
                  </Button>
                  <span className="mx-2 w-[127px] text-center">
                    {format(search.date ? new Date(search.date) : new Date(), 'MMMM yyyy')}
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
            {/* <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <TopSidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </div>
            </header> */}

            {/* KEEP THIS COMPONENT HERE FOR SIDEBAR TO TOGGLE PROPERLY */}
            <TopSidebarTrigger />
            {/* <div className="flex flex-1 flex-col gap-4 pt-0">{children}</div> */}
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
