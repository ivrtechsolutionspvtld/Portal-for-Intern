'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import IVRLogo from '@/components/IVRLogo';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  FolderGit2,
  Award,
  CreditCard,
  Bell,
  MessageSquare,
  BookOpen,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  CheckCircle2,
  UserCheck,
  QrCode,
  Sparkles,
  UserPlus,
  BarChart3,
  FileText,
  UserCog,
  MessagesSquare,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';

interface DashboardLayoutProps {
  role: 'ADMIN' | 'MENTOR' | 'STUDENT';
  children: React.ReactNode;
}

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Load current session
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role !== role) {
            router.push('/login');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    }
    loadUser();
  }, [router, role]);

  // Load notifications
  useEffect(() => {
    async function loadNotifs() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const markAllNotifsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Role-specific nav items (Enterprise Purple Admin Sections & Dedicated Portals)
  const adminNav = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Student Management', href: '/admin/students', icon: Users },
    { label: 'Mentor Management', href: '/admin/mentors', icon: UserCheck },
    { label: 'Account Approvals', href: '/admin/approvals', icon: UserPlus },
    { label: 'Course Management', href: '/admin/courses', icon: BookOpen },
    { label: 'Mentor Allocation', href: '/admin/allocation', icon: UserCheck },
    { label: 'Attendance Management', href: '/admin/attendance', icon: CheckSquare },
    { label: 'Internship Programs', href: '/admin/batches', icon: CalendarCheck },
    { label: 'Applications', href: '/admin/applications', icon: GraduationCap },
    { label: 'Assignments & Tasks', href: '/admin/projects', icon: FolderGit2 },
    { label: 'Performance Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Certificates', href: '/admin/certificates', icon: Award },
    { label: 'Notifications', href: '/admin/announcements', icon: Bell },
    { label: 'Reports & Exports', href: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Communication', href: '/admin/communication', icon: MessagesSquare },
    { label: 'User Roles & Permissions', href: '/admin/roles', icon: UserCog },
    { label: 'Administrator Management', href: '/admin/administrators', icon: ShieldCheck },
    { label: 'System Settings', href: '/admin/settings', icon: Settings },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
  ];

  const mentorNav = [
    { label: 'Overview & Analytics', href: '/mentor', icon: LayoutDashboard },
    { label: 'Mentor Profile', href: '/mentor/profile', icon: UserCheck },
    { label: 'Assigned Students', href: '/mentor/students', icon: Users },
    { label: 'Attendance & QR Scanner', href: '/mentor/attendance', icon: QrCode },
    { label: 'Assignments & Reviews', href: '/mentor/projects', icon: FolderGit2 },
    { label: 'Student Communication', href: '/mentor/messages', icon: MessageSquare },
    { label: 'Announcements', href: '/mentor/announcements', icon: Bell },
    { label: 'Cohort Reports', href: '/mentor/reports', icon: FileSpreadsheet },
  ];

  const studentNav = [
    { label: 'Overview', href: '/student', icon: LayoutDashboard },
    { label: 'Student Profile', href: '/student/profile', icon: Users },
    { label: 'Learning Resources', href: '/student/learning', icon: BookOpen },
    { label: 'Attendance & Daily Check-in', href: '/student/attendance', icon: CalendarCheck },
    { label: 'Assignments & Tasks', href: '/student/projects', icon: FolderGit2 },
    { label: 'Mentor Messages', href: '/student/messages', icon: MessageSquare },
    { label: 'Announcements', href: '/student/announcements', icon: Bell },
    { label: 'Certificate & QR', href: '/student/certificate', icon: Award },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'MENTOR' ? mentorNav : studentNav;

  const roleLabels = {
    ADMIN: { title: 'Enterprise Administrator', badge: 'Admin Portal', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    MENTOR: { title: 'Academic Mentor', badge: 'Faculty Portal', color: 'bg-purple-50 text-[#5B21B6] border-[#DDD6FE]' },
    STUDENT: { title: 'Internship Fellow', badge: 'Student Portal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <IVRLogo size="sm" />
          <span className="hidden sm:inline-block text-xs font-bold px-2 py-0.5 rounded-md border border-purple-200 bg-purple-50 text-[#5B21B6]">
            {roleLabels[role].badge}
          </span>
        </div>

        {/* Global Search & Notifications */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center relative w-64 lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students, batches, projects..."
              className="w-full text-xs bg-slate-100/80 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all"
            />
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-purple-100 text-[#5B21B6] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotifsRead}
                      className="text-[11px] text-[#6D28D9] hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                          !n.isRead ? 'bg-purple-50/40' : ''
                        }`}
                      >
                        <div className="font-semibold text-slate-800">{n.title}</div>
                        <div className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4C1D95] to-[#7C3AED] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {user?.name || 'Authorized User'}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">{role.toLowerCase()}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main App Workspace */}
      <div className="flex flex-1">
        {/* Sidebar for Desktop */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-200 z-20 shrink-0 ${
            collapsed ? 'w-18' : 'w-64'
          }`}
        >
          {/* Collapse Toggle */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-end">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4C1D95] to-[#6D28D9] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-[#5B21B6] hover:bg-purple-50'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Info Card */}
          {!collapsed && (
            <div className="p-4 m-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#5B21B6] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>IVR TECH SOLUTIONS</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                AWS Mumbai (ap-south-1) cluster active. Zero security anomalies.
              </p>
            </div>
          )}
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
            <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col z-10">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <IVRLogo size="sm" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                        isActive
                          ? 'bg-[#6D28D9] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:bg-purple-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
