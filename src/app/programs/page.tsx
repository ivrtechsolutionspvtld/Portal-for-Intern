'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import { APPLICATION_GOOGLE_FORM_URL } from '@/lib/constants';
import { usePortalSync } from '@/lib/sync';
import { Clock, Layers, ArrowRight, CheckCircle2, Award, Terminal, ExternalLink, Briefcase } from 'lucide-react';

interface ProgramItem {
  id: string;
  name: string;
  domain: string;
  duration: string;
  level: string;
  description: string;
  techStack: string[];
  projects: string[];
  mode?: string;
  stipend?: string;
  code?: string | null;
}

function parseList(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

export default function ProgramsPage() {
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/public/programs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const activePrograms = data.programs || [];
        const activeDomains = data.domains || [];

        // If Admin has created official Internship Programs, show them;
        // Also combine with active Course tracks
        const unifiedItems: ProgramItem[] = [];

        if (activePrograms.length > 0) {
          activePrograms.forEach((p: any) => {
            unifiedItems.push({
              id: p.id,
              name: p.title,
              domain: p.domain || p.course?.domain || p.title,
              duration: p.duration || '8 Weeks',
              level: p.level || 'Intermediate',
              description: p.description,
              techStack: parseList(p.techStack),
              projects: parseList(p.projects),
              mode: p.mode || 'Virtual / Remote',
              stipend: p.stipend || 'Performance Based',
              code: p.course?.code || null,
            });
          });
        }

        // Also add any active Course domain tracks that don't already have a dedicated program
        activeDomains.forEach((d: any) => {
          const alreadyCovered = unifiedItems.some(
            (u) => u.domain.toLowerCase() === d.domain.toLowerCase() || u.name.toLowerCase() === d.name.toLowerCase()
          );
          if (!alreadyCovered) {
            unifiedItems.push({
              id: d.id,
              name: d.name,
              domain: d.domain,
              duration: d.duration,
              level: d.level,
              description: d.description,
              techStack: parseList(d.techStack),
              projects: parseList(d.projects),
              code: d.code,
            });
          }
        });

        setItems(unifiedItems);
      }
    } catch (err) {
      console.error('Failed to load programs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization: refetch immediately when Admin makes changes
  usePortalSync(loadData, 5000);

  // Distinct domain filters
  const uniqueDomains = Array.from(new Set(items.map((i) => i.domain))).filter(Boolean);

  const filteredItems =
    selectedDomain === 'all'
      ? items
      : items.filter((d) => d.domain === selectedDomain || d.id === selectedDomain);

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <PublicNavbar />

      <section className="bg-gradient-to-b from-purple-50/60 to-white py-16 sm:py-20 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#6D28D9] mb-3 inline-block">
            Comprehensive Curricula
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Specialized Internship Programs
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Engineered around the modern industry software stack. Interns acquire hands-on mastery through real architectural deliveries, not passive tutorials.
          </p>

          {/* Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedDomain('all')}
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                selectedDomain === 'all'
                  ? 'bg-[#4C1D95] text-white border-[#4C1D95]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Programs ({items.length})
            </button>
            {uniqueDomains.map((dName) => (
              <button
                key={dName}
                onClick={() => setSelectedDomain(dName)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                  selectedDomain === dName
                    ? 'bg-[#4C1D95] text-white border-[#4C1D95]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {dName.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Program Catalog */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="p-8 bg-white border border-slate-200 rounded-2xl animate-pulse h-64" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Active Programs Listed</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Admin is currently updating the active internship curriculum. Please check back shortly or explore available tracks on the home page.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="ivr-card p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
              >
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold uppercase px-3 py-1 rounded-md bg-purple-50 text-[#5B21B6] border border-purple-200">
                      {item.duration}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                      {item.level}
                    </span>
                    {item.mode && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                        {item.mode}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      Track #{index + 1}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {item.name}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Tech Stack Badges */}
                  {item.techStack.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Core Technologies & Frameworks
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-purple-50/60 text-[#4C1D95] border border-purple-100"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestone Projects */}
                  {item.projects.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Production Capstone Deliverables
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
                        {item.projects.map((proj) => (
                          <div
                            key={proj}
                            className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{proj}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Action Box */}
                <div className="bg-gradient-to-br from-[#FAF5FF] to-white p-6 rounded-xl border border-purple-100 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#7C3AED]" />
                      Fellowship Prerequisites
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                      <li>• Basic proficiency in core engineering concepts.</li>
                      <li>• Enrolled in or graduated from recognized university.</li>
                      <li>• Minimum commitment aligned with track duration.</li>
                      <li>• Personal laptop meeting standard dev requirements.</li>
                      {item.stipend && (
                        <li className="text-emerald-700 font-semibold">• Stipend: {item.stipend}</li>
                      )}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-purple-100">
                    <a
                      href={APPLICATION_GOOGLE_FORM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full btn-ivr-primary text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm text-center"
                    >
                      Apply for this Program
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
