import React from 'react';
import { getBinStatus } from '../../lib/formatters';
import type { Dustbin, Thresholds } from '../../types/api';

/**
 * Brand mark combining a pitched college hall / campus house roofline with a small botanical leaf.
 */
export const BrandLeafBuildingMark: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect width="36" height="36" rx="5" fill="#244F34" />
    {/* College hall pitched roof & facade */}
    <path
      d="M7 18.5L18 10.5L29 18.5"
      stroke="#F5F2EB"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 17V27H26V17"
      stroke="#F5F2EB"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Arched campus doorway */}
    <path d="M15.5 27V22C15.5 20.6 16.6 19.5 18 19.5C19.4 19.5 20.5 20.6 20.5 22V27" stroke="#DEC4AC" strokeWidth="1.5" />
    {/* Little sprouting leaf above roof */}
    <path
      d="M18 10.5C18 6.5 21.8 4.8 25 5.2C24.4 8.5 21.6 10.5 18 10.5Z"
      fill="#8FB98B"
      stroke="#F5F2EB"
      strokeWidth="0.9"
    />
    <path d="M18 10.5C16.2 8.2 13.8 7.5 11.8 8.1C12.8 10 15.2 10.8 18 10.5Z" fill="#C9A882" />
  </svg>
);

/**
 * Minimalist botanical leaf sprig for subtle section headers, dividers, and footers.
 */
export const LeafSprig: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 text-leaf' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 20C7.5 15 12 10.5 19.5 4.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M11 13C10.5 8.8 13.5 5.5 19.2 4.8C18.4 10.3 15.3 13.4 11 13Z"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M7.8 16.2C4.8 15.5 3.4 13.3 4.2 10.2C7.3 10.6 8.9 12.8 7.8 16.2Z"
      fill="#7A4B2A"
      fillOpacity="0.16"
      stroke="#7A4B2A"
      strokeWidth="1.15"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Tiny architectural college building + house silhouette icon for empty states and banners.
 */
export const CampusHouseLineArt: React.FC<{ className?: string }> = ({ className = 'w-28 h-16' }) => (
  <svg viewBox="0 0 140 80" fill="none" className={className} aria-hidden="true">
    <line x1="8" y1="68" x2="132" y2="68" stroke="#C2B59E" strokeWidth="1.2" />
    {/* Left little house / hostel cottage */}
    <path d="M18 68V47L32 37L46 47V68" stroke="#7A4B2A" strokeWidth="1.4" strokeLinejoin="round" fill="#F4EAE0" fillOpacity="0.55" />
    <rect x="28" y="55" width="8" height="13" stroke="#7A4B2A" strokeWidth="1.2" />
    <rect x="22" y="49" width="4" height="4" stroke="#7A4B2A" strokeWidth="1.1" />
    <rect x="38" y="49" width="4" height="4" stroke="#7A4B2A" strokeWidth="1.1" />
    {/* Center college academic hall with clock gable */}
    <path d="M54 68V34H96V68" stroke="#244F34" strokeWidth="1.4" fill="#E6EFE8" fillOpacity="0.65" />
    <path d="M50 34L75 18L100 34" stroke="#244F34" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="75" cy="27" r="3" stroke="#7A4B2A" strokeWidth="1.2" />
    <path d="M70 68V54C70 51.2 72.2 49 75 49C77.8 49 80 51.2 80 54V68" stroke="#244F34" strokeWidth="1.3" />
    <rect x="59" y="41" width="5" height="7" stroke="#244F34" strokeWidth="1.1" />
    <rect x="86" y="41" width="5" height="7" stroke="#244F34" strokeWidth="1.1" />
    {/* Right botanical tree & little leaves */}
    <line x1="115" y1="68" x2="115" y2="42" stroke="#7A4B2A" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M115 45C115 37 122 33 128 34C127 41 121 46 115 45Z" fill="#4B7448" fillOpacity="0.25" stroke="#244F34" strokeWidth="1.2" />
    <path d="M115 51C115 44 108 40 102 41C103 48 109 52 115 51Z" fill="#4B7448" fillOpacity="0.22" stroke="#244F34" strokeWidth="1.2" />
    <path d="M115 39C113 32 115 26 119 23C122 28 120 35 115 39Z" fill="#244F34" fillOpacity="0.18" stroke="#244F34" strokeWidth="1.2" />
  </svg>
);

/**
 * Editorial architectural illustration for Auth left panel:
 * VIT Bhopal college academic block, hostel house, trees, little floating botanical leaves, and a smart bin.
 */
export const CollegeCampusSkyline: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => (
  <svg viewBox="0 0 460 270" fill="none" className={className} aria-hidden="true">
    {/* Subtle archival grid lines */}
    <path d="M24 232H436" stroke="#B9D1C0" strokeWidth="1.2" strokeOpacity="0.55" />
    <path d="M40 242H420" stroke="#DEC4AC" strokeWidth="0.9" strokeOpacity="0.4" strokeDasharray="3 4" />

    {/* Distant campus hills */}
    <path
      d="M24 232C78 198 134 196 196 216C262 238 338 188 436 218V232H24Z"
      fill="#1D412B"
      fillOpacity="0.45"
    />

    {/* Left: Campus Hostel / Residential House */}
    <g>
      <path d="M42 232V168L82 140L122 168V232" fill="#2B593C" stroke="#E6EFE8" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M36 171L82 138L128 171" stroke="#DEC4AC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Chimney */}
      <rect x="100" y="145" width="9" height="14" stroke="#DEC4AC" strokeWidth="1.2" fill="#244F34" />
      {/* House windows & door */}
      <rect x="55" y="178" width="14" height="14" rx="1" stroke="#E6EFE8" strokeWidth="1.15" fill="#7A4B2A" fillOpacity="0.45" />
      <rect x="95" y="178" width="14" height="14" rx="1" stroke="#E6EFE8" strokeWidth="1.15" fill="#7A4B2A" fillOpacity="0.45" />
      <path d="M74 232V206C74 202.7 76.7 200 80 200H84C87.3 200 90 202.7 90 206V232" stroke="#DEC4AC" strokeWidth="1.3" fill="#183623" />
    </g>

    {/* Center: VIT Bhopal Main Academic Hall with Clocktower */}
    <g>
      {/* Main wings */}
      <rect x="148" y="136" width="164" height="96" fill="#1B3E28" stroke="#E6EFE8" strokeWidth="1.4" />
      {/* Central pediment */}
      <path d="M188 136L230 104L272 136" fill="#285438" stroke="#DEC4AC" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Clock tower */}
      <rect x="216" y="72" width="28" height="38" fill="#1F462E" stroke="#E6EFE8" strokeWidth="1.3" />
      <path d="M212 72L230 52L248 72Z" fill="#7A4B2A" stroke="#DEC4AC" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="230" cy="88" r="6" stroke="#DEC4AC" strokeWidth="1.2" />
      <path d="M230 85V88L232.5 89.5" stroke="#DEC4AC" strokeWidth="1.1" strokeLinecap="round" />

      {/* Columns */}
      {[196, 212, 248, 264].map(x => (
        <line key={x} x1={x} y1="142" x2={x} y2="232" stroke="#B9D1C0" strokeWidth="1.3" strokeOpacity="0.85" />
      ))}

      {/* Arched Entrance */}
      <path d="M219 232V194C219 188 224 183 230 183C236 183 241 188 241 194V232" stroke="#DEC4AC" strokeWidth="1.4" fill="#132D1D" />

      {/* Academic block windows */}
      {[160, 174, 280, 294].map(x => (
        <React.Fragment key={x}>
          <rect x={x} y="152" width="9" height="16" rx="1" stroke="#B9D1C0" strokeWidth="1.1" fill="#2C5E3E" />
          <rect x={x} y="180" width="9" height="16" rx="1" stroke="#B9D1C0" strokeWidth="1.1" fill="#2C5E3E" />
        </React.Fragment>
      ))}
    </g>

    {/* Right: Smart Bin Node + Campus Tree */}
    <g>
      {/* Tree trunk & leaf crown */}
      <path d="M352 232V178" stroke="#DEC4AC" strokeWidth="2" strokeLinecap="round" />
      <path d="M352 195L338 184" stroke="#DEC4AC" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M352 188L366 177" stroke="#DEC4AC" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M352 182C338 176 333 160 344 150C356 146 369 156 368 171C367 179 360 183 352 182Z" fill="#4B7448" fillOpacity="0.55" stroke="#B9D1C0" strokeWidth="1.2" />
      <path d="M335 190C325 186 322 175 330 169C338 168 345 176 343 185" fill="#4B7448" fillOpacity="0.4" stroke="#B9D1C0" strokeWidth="1.1" />

      {/* Smart Bin Unit beside tree */}
      <rect x="386" y="186" width="32" height="46" rx="3" fill="#2B593C" stroke="#E6EFE8" strokeWidth="1.4" />
      <rect x="383" y="180" width="38" height="7" rx="2" fill="#7A4B2A" stroke="#DEC4AC" strokeWidth="1.2" />
      {/* Ultrasonic indicator bars */}
      <rect x="394" y="196" width="16" height="4" rx="1" fill="#8FB98B" />
      <rect x="394" y="203" width="16" height="4" rx="1" fill="#8FB98B" fillOpacity="0.65" />
      <rect x="394" y="210" width="16" height="4" rx="1" fill="#DEC4AC" fillOpacity="0.5" />
      {/* Subtle Wi-Fi arcs above bin */}
      <path d="M396 171C399.5 168 404.5 168 408 171" stroke="#B9D1C0" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M392 165C398 160.5 406 160.5 412 165" stroke="#B9D1C0" strokeWidth="1.1" strokeOpacity="0.65" strokeLinecap="round" />
    </g>

    {/* Little botanical leaves framing top corners */}
    <g opacity="0.8">
      <path d="M38 42C56 40 70 50 74 66C57 68 43 58 38 42Z" fill="#4B7448" fillOpacity="0.45" stroke="#B9D1C0" strokeWidth="1.1" />
      <path d="M38 42C52 50 63 58 74 66" stroke="#B9D1C0" strokeWidth="0.9" />
      <path d="M84 36C96 31 108 35 113 46C101 50 89 46 84 36Z" fill="#7A4B2A" fillOpacity="0.4" stroke="#DEC4AC" strokeWidth="1" />

      <path d="M416 54C398 52 385 62 382 77C399 79 412 69 416 54Z" fill="#4B7448" fillOpacity="0.45" stroke="#B9D1C0" strokeWidth="1.1" />
      <path d="M416 54C403 61 392 69 382 77" stroke="#B9D1C0" strokeWidth="0.9" />
      <path d="M366 44C356 41 347 45 344 55C354 58 363 54 366 44Z" fill="#7A4B2A" fillOpacity="0.4" stroke="#DEC4AC" strokeWidth="1" />
    </g>
  </svg>
);

/**
 * Interactive architectural campus map of VIT Bhopal showing college buildings,
 * hostel houses, central pathways, little leaf clusters, and clickable live Smart Bin nodes.
 */
interface CampusBlueprintProps {
  bins: Dustbin[];
  thresholds: Thresholds;
  selectedBinId: string | null;
  onSelectBin: (binId: string) => void;
  compact?: boolean;
}

export const CampusBlueprintSvg: React.FC<CampusBlueprintProps> = ({
  bins,
  thresholds,
  selectedBinId,
  onSelectBin,
  compact = false,
}) => {
  return (
    <div className="relative w-full overflow-hidden rounded-md border border-border bg-[#EFECE3]">
      <svg
        viewBox="0 0 800 440"
        className={`w-full block ${compact ? 'h-[260px]' : 'h-[430px]'} object-contain`}
        role="img"
        aria-label="VIT Bhopal University Smart Bin Campus Map"
      >
        {/* Parchment base + soft lawn areas */}
        <rect width="800" height="440" fill="#F2EFE6" />
        <rect x="20" y="20" width="760" height="400" rx="6" fill="#EDE9DD" stroke="#D9D0BF" strokeWidth="1.2" />

        {/* Campus Green Lawns */}
        <rect x="44" y="42" width="235" height="150" rx="4" fill="#E3ECE3" stroke="#C8DAC9" strokeWidth="1" />
        <rect x="305" y="42" width="200" height="135" rx="4" fill="#E3ECE3" stroke="#C8DAC9" strokeWidth="1" />
        <rect x="530" y="42" width="225" height="215" rx="4" fill="#E6EFE6" stroke="#C8DAC9" strokeWidth="1" />
        <rect x="260" y="215" width="245" height="175" rx="4" fill="#E7EFE5" stroke="#C8DAC9" strokeWidth="1" />
        <rect x="530" y="275" width="225" height="115" rx="4" fill="#DFEAD9" stroke="#C0D5BE" strokeWidth="1" />

        {/* Campus Walkways & Roads (Warm sandstone brown) */}
        <path d="M44 203H755" stroke="#DFD5C3" strokeWidth="18" />
        <path d="M44 203H755" stroke="#C9B99F" strokeWidth="1" strokeDasharray="6 6" />
        <path d="M292 42V390" stroke="#DFD5C3" strokeWidth="16" />
        <path d="M518 42V390" stroke="#DFD5C3" strokeWidth="16" />

        {/* Building 1: Academic Block (Top Left) */}
        <g transform="translate(86, 62)">
          <rect x="0" y="26" width="144" height="58" rx="2" fill="#FDFCF9" stroke="#564738" strokeWidth="1.5" />
          <path d="M-6 26L72 2L150 26Z" fill="#7A4B2A" fillOpacity="0.18" stroke="#7A4B2A" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="61" y="54" width="22" height="30" fill="#E6EFE8" stroke="#244F34" strokeWidth="1.2" />
          {[18, 38, 96, 116].map(x => (
            <rect key={x} x={x} y="40" width="12" height="16" fill="#EDE8DC" stroke="#7D6E5D" strokeWidth="1" />
          ))}
          <text x="72" y="102" textAnchor="middle" fill="#1E241C" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            ACADEMIC BLOCK
          </text>
        </g>

        {/* Building 2: Central Library (Top Center) */}
        <g transform="translate(340, 58)">
          <rect x="0" y="24" width="130" height="52" rx="2" fill="#FDFCF9" stroke="#564738" strokeWidth="1.5" />
          <path d="M-5 24L65 6L135 24Z" fill="#244F34" fillOpacity="0.16" stroke="#244F34" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="25" y1="24" x2="25" y2="76" stroke="#BFAF95" strokeWidth="1.2" />
          <line x1="65" y1="24" x2="65" y2="76" stroke="#BFAF95" strokeWidth="1.2" />
          <line x1="105" y1="24" x2="105" y2="76" stroke="#BFAF95" strokeWidth="1.2" />
          <text x="65" y="94" textAnchor="middle" fill="#1E241C" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            CENTRAL LIBRARY
          </text>
        </g>

        {/* Building 3: Hostel Zone Houses (Top Right) */}
        <g transform="translate(566, 62)">
          {/* Hostel House D */}
          <path d="M0 58V22L34 4L68 22V58Z" fill="#FDFCF9" stroke="#7A4B2A" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M-4 24L34 4L72 24" stroke="#7A4B2A" strokeWidth="2" strokeLinecap="round" />
          <rect x="26" y="38" width="16" height="20" fill="#F4EAE0" stroke="#7A4B2A" strokeWidth="1.1" />
          {/* Hostel House A */}
          <path d="M84 128V92L118 74L152 92V128Z" fill="#FDFCF9" stroke="#7A4B2A" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M80 94L118 74L156 94" stroke="#7A4B2A" strokeWidth="2" strokeLinecap="round" />
          <rect x="110" y="108" width="16" height="20" fill="#F4EAE0" stroke="#7A4B2A" strokeWidth="1.1" />
          <text x="72" y="156" textAnchor="middle" fill="#1E241C" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            HOSTEL ZONE (BLOCKS A & D)
          </text>
        </g>

        {/* Building 4: Food Court Pavilion (Bottom Center) */}
        <g transform="translate(316, 240)">
          <rect x="0" y="22" width="136" height="50" rx="2" fill="#FDFCF9" stroke="#564738" strokeWidth="1.4" />
          <path d="M-8 22H144L134 8H2Z" fill="#7A4B2A" fillOpacity="0.2" stroke="#7A4B2A" strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="20" y="34" width="38" height="22" fill="#F5F2EB" stroke="#BFAF95" strokeWidth="1" />
          <rect x="78" y="34" width="38" height="22" fill="#F5F2EB" stroke="#BFAF95" strokeWidth="1" />
          <text x="68" y="92" textAnchor="middle" fill="#1E241C" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            CAFETERIA & FOOD COURT
          </text>
        </g>

        {/* Building 5: Sports Complex Track (Bottom Right) */}
        <g transform="translate(556, 294)">
          <rect x="0" y="4" width="174" height="68" rx="34" fill="#E6EFE8" stroke="#4B7448" strokeWidth="1.4" strokeDasharray="4 3" />
          <rect x="18" y="16" width="138" height="44" rx="22" fill="#D8E8D8" stroke="#4B7448" strokeWidth="1" />
          <text x="87" y="42" textAnchor="middle" fill="#244F34" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            SPORTS COMPLEX
          </text>
        </g>

        {/* Building 6: Main Gate & Security Booth (Bottom Left) */}
        <g transform="translate(70, 296)">
          <path d="M12 52V20H98V52" stroke="#7A4B2A" strokeWidth="2" fill="none" />
          <path d="M6 20L55 4L104 20Z" fill="#7A4B2A" fillOpacity="0.22" stroke="#7A4B2A" strokeWidth="1.4" />
          <rect x="110" y="28" width="44" height="24" fill="#FDFCF9" stroke="#564738" strokeWidth="1.3" />
          <text x="74" y="72" textAnchor="middle" fill="#1E241C" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            MAIN GATE & SECURITY
          </text>
        </g>

        {/* Little Botanical Leaf Clusters scattered across campus lawns */}
        {[
          [66, 174],
          [246, 70],
          [322, 152],
          [482, 82],
          [554, 232],
          [730, 74],
          [282, 366],
          [480, 358],
          [734, 372],
        ].map(([cx, cy], idx) => (
          <g key={idx} transform={`translate(${cx}, ${cy})`} opacity="0.7">
            <path d="M0 0C-5 -7 -2 -14 4 -15C7 -8 5 -2 0 0Z" fill="#4B7448" fillOpacity="0.35" stroke="#244F34" strokeWidth="0.9" />
            <path d="M0 0C6 -4 12 -1 13 5C6 7 1 5 0 0Z" fill="#4B7448" fillOpacity="0.28" stroke="#244F34" strokeWidth="0.9" />
          </g>
        ))}

        {/* Clickable Live Smart Bin Markers */}
        {bins.map((bin, idx) => {
          const status = getBinStatus(bin, thresholds);
          const x = ((bin.map_x ?? ((idx * 17 + 18) % 78) + 10) / 100) * 800;
          const y = ((bin.map_y ?? ((idx * 23 + 22) % 68) + 16) / 100) * 440;
          const isSelected = selectedBinId === bin.id;

          return (
            <g
              key={bin.id}
              transform={`translate(${x}, ${y})`}
              onClick={() => onSelectBin(bin.id)}
              className="cursor-pointer group"
              role="button"
              tabIndex={0}
              aria-label={`${bin.id} ${bin.name} ${bin.fill_percentage}%`}
            >
              {isSelected && (
                <circle r="22" fill={status.hex} fillOpacity="0.16" stroke={status.hex} strokeWidth="1.5" strokeDasharray="3 2" />
              )}
              <circle
                r={isSelected ? 15 : 13}
                fill="#FDFCF9"
                stroke={status.hex}
                strokeWidth={isSelected ? 3 : 2.2}
              />
              <circle r="5" fill={status.hex} />
              {/* Monospace label tag */}
              <g transform="translate(0, 23)">
                <rect
                  x="-34"
                  y="-9"
                  width="68"
                  height="17"
                  rx="3"
                  fill={isSelected ? '#1E241C' : '#FDFCF9'}
                  stroke={isSelected ? '#1E241C' : '#C2B59E'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill={isSelected ? '#FDFCF9' : '#1E241C'}
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {bin.id} · {bin.fill_percentage}%
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Bottom Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-surface border-t border-border text-[11px] text-bark">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-forest" />
            Normal (0–{thresholds.normalMax}%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-ochre" />
            Moderate ({thresholds.normalMax + 1}–{thresholds.moderateMax}%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-clay" />
            Full (&gt;{thresholds.moderateMax}%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-soil" />
            Offline
          </span>
        </div>
        <span className="font-mono text-[10px] text-soil">VIT BHOPAL CAMPUS · CLICK ANY BIN NODE</span>
      </div>
    </div>
  );
};
