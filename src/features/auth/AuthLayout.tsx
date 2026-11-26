import React from 'react';
import {
  BrandLeafBuildingMark,
  CollegeCampusSkyline,
  LeafSprig,
} from '../../components/illustrations/CampusMotifs';
import { USE_MOCK_API } from '../../lib/apiClient';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-canvas grid lg:grid-cols-12">
      {/* Left Architectural Editorial Panel — Deep Forest Green & Warm Walnut Brown */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-forest text-surface flex-col justify-between p-10 border-r border-forest-hover relative overflow-hidden">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BrandLeafBuildingMark className="w-9 h-9 ring-1 ring-surface/20 rounded" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9D9C8]">
                VIT Bhopal University
              </p>
              <p className="text-sm font-semibold text-surface tracking-tight">
                Smart Bin Monitoring System
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-surface/15 space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#DEC4AC]">
              Facilities &amp; Sanitation Telemetry
            </p>
            <h1 className="font-editorial text-3xl xl:text-[34px] font-semibold leading-[1.15] text-surface">
              Real-time waste monitoring for a cleaner campus.
            </h1>
            <p className="text-sm text-[#D6E1D7] leading-relaxed max-w-md">
              Monitor ESP32 ultrasonic fill levels, MQ-135 odor sensors, and solar battery health
              across Academic Blocks, Central Library, Hostels, Food Court, and Sports Complex.
            </p>
          </div>
        </div>

        {/* Custom Architectural College Hall, Hostel House & Little Leaves SVG */}
        <div className="my-6">
          <CollegeCampusSkyline className="w-full max-w-[440px] mx-auto" />
        </div>

        <div className="pt-5 border-t border-surface/15 flex items-center justify-between text-xs text-[#C6D5C7]">
          <div className="flex items-center gap-2">
            <LeafSprig className="w-4 h-4 text-[#9BC297]" />
            <span>ESP32 · HC-SR04 · 6V Solar · Campus Wi-Fi</span>
          </div>
          <span className="font-mono text-[11px] text-[#DEC4AC]">CleanCity IoT</span>
        </div>
      </aside>

      {/* Right Auth Form Column */}
      <main className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        {/* Mobile header */}
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <BrandLeafBuildingMark className="w-8 h-8" />
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-cedar">VIT Bhopal</p>
              <p className="text-sm font-semibold text-ink">Smart Bin Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-soil font-mono">
            <span
              className={`w-2 h-2 rounded-full ${USE_MOCK_API ? 'bg-ochre' : 'bg-forest'}`}
            />
            <span>{USE_MOCK_API ? 'Local Mock Mode' : 'MySQL Session Auth'}</span>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-8">
          <div className="mb-6">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-cedar mb-1.5">
              <LeafSprig className="w-3.5 h-3.5 text-leaf" />
              <span>Campus Facilities Portal</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-[28px] font-semibold text-ink tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-bark mt-1">{subtitle}</p>
          </div>

          <div className="bg-surface border border-border rounded-md p-6 sm:p-7">
            {children}
          </div>
        </div>

        <footer className="text-center lg:text-left text-xs text-soil flex flex-wrap items-center justify-between gap-2 max-w-md mx-auto w-full">
          <span>Facilities Management Office · VIT Bhopal</span>
          <span className="font-mono text-[11px]">HttpOnly Session Cookie</span>
        </footer>
      </main>
    </div>
  );
};
