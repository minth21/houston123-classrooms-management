"use client";

import "@/lib/i18n"; 
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Menu,
  X,
  Home,
  BookOpen,
  List,
  Users,
  Settings,
  Bell,
  ChevronRight,
  Building2,
  MapPin,
  Video,
  Sun,
  Moon,
  Globe,
  ChevronsUpDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { companyService, Company, Branch } from "@/lib/api/company";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  path?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  badge?: string;
}

// --- Custom Hook cho Dark Mode ---
function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };
  return { isDarkMode, toggleDarkMode };
}


// START FIX: Tách logic render item ra component riêng
// =======================================================

interface NavItemProps {
  item: NavItem;
  isSidebarCollapsed: boolean;
  pathname: string;
}

const NavListItem: React.FC<NavItemProps> = ({ item, isSidebarCollapsed, pathname }) => {
  // Mỗi NavListItem sẽ có state riêng, hoàn toàn độc lập
  const [isOpen, setIsOpen] = useState(false);

  const isChildActive = item.children?.some(
    (child) => pathname === child.path
  );

  useEffect(() => {
    // Tự động mở nếu có mục con đang active
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  // Render item có menu con (dạng listbox)
  if (item.children) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isChildActive
              ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`${isChildActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
              {item.icon}
            </div>
            {!isSidebarCollapsed && <span>{item.name}</span>}
          </div>
          {!isSidebarCollapsed && (
            <ChevronsUpDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="py-1 pl-7 pr-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.path}
                href={child.path || "#"}
                className={`flex items-center w-full px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === child.path
                    ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {child.icon && <div className="mr-3">{child.icon}</div>}
                <span>{child.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render item là một link đơn
  return (
    <Link
      key={item.path}
      href={item.path || "#"}
      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium mb-1 transition-colors ${
        pathname === item.path
          ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <div className={`${pathname === item.path ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
        {item.icon}
      </div>
      {!isSidebarCollapsed && <span>{item.name}</span>}
      {!isSidebarCollapsed && item.badge && (
        <Badge className="ml-auto px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
};


export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; path: string }[]>([]);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);

  const toggleLanguage = () => {
    const newLang = language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
  };

  const handleBranchSelect = useCallback((branchCode: string) => {
    if (branchCode === selectedBranch) return;
    setSelectedBranch(branchCode);
    companyService.setSelectedBranch(branchCode);
    window.dispatchEvent(new CustomEvent("branchChanged"));
  }, [selectedBranch]);

  const loadBranches = useCallback(async (companyId: string, isUserAction: boolean = false) => {
    try {
      const data = await companyService.getBranches(companyId);
      setBranches(data);
      const storedBranch = companyService.getSelectedBranch();
      const branchExists = data.some((branch) => branch.code === storedBranch);
      if (!isUserAction && storedBranch && branchExists) {
        setSelectedBranch(storedBranch);
      } else if (data.length > 0) {
        handleBranchSelect(data[0].code);
      } else {
        setSelectedBranch(null);
        companyService.setSelectedBranch("");
        window.dispatchEvent(new CustomEvent("branchChanged"));
      }
    } catch (err) {
      console.error("Failed to load branches", err);
    }
  }, [handleBranchSelect]);
  
  const handleCompanySelect = useCallback((companyId: string) => {
    if (companyId === selectedCompany) return;
    setSelectedCompany(companyId);
    companyService.setSelectedCompany(companyId);
    loadBranches(companyId, true);
  }, [selectedCompany, loadBranches]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsCompanyLoading(true);
        const companyData = await companyService.getCompanies();
        setCompanies(companyData);
        let currentCompanyId = companyService.getSelectedCompany();
        if (!currentCompanyId && companyData.length > 0) {
          currentCompanyId = companyData[0]._id;
          companyService.setSelectedCompany(currentCompanyId);
        }
        if (currentCompanyId) {
          setSelectedCompany(currentCompanyId);
          await loadBranches(currentCompanyId);
        }
      } catch (err) {
        console.error("Failed to load companies", err);
      } finally {
        setIsCompanyLoading(false);
      }
    };
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, loadBranches]);

  useEffect(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbItems = pathSegments.map((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
      let name = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (index === 0 && segment === "dashboard") name = "Dashboard";
      return { name, path };
    });
    setBreadcrumbs(breadcrumbItems);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems: NavItem[] = [
    {
      name: t("nav.overview"),
      path: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: t("nav.classrooms"),
      icon: <BookOpen className="h-5 w-5" />,
      children: [
        {
          name: t("nav.classroom_list"),
          path: "/dashboard/classrooms",
          icon: <List className="h-5 w-5" />,
        },
        {
          name: t("nav.recordings"),
          path: "/dashboard/recordings",
          icon: <Video className="h-5 w-5" />,
        },
      ],
      badge: t("nav.new_badge"),
    },
    {
      name: t("nav.student_list"),
      icon: <Users className="h-5 w-5" />,
      children: [
        { name: t("nav.all_students"), path: "/dashboard/students" },
        { name: t("nav.absent_students"), path: "/dashboard/absent" }, 
        { name: t("nav.score_students"), path: "/dashboard/low_score" },
      ],
    }, 
    {
      name: t("nav.teachers"),
      path: "/dashboard/teachers",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: t("nav.settings"),
      path: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const renderMobileNavItem = (item: NavItem) => {
    if (item.children) {
      return (
        <div key={item.name} className="space-y-1">
          <div className="px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center space-x-2">
            {item.icon}
            <span>{item.name}</span>
            {item.badge && (
              <Badge className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
                {item.badge}
              </Badge>
            )}
          </div>
          <div className="pl-8 space-y-1 border-l-2 border-gray-200 dark:border-gray-700">
            {item.children.map((child) => (
              <Link
                key={child.path}
                href={child.path || "#"}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === child.path
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {child.icon}
                <span>{child.name}</span>
              </Link>
            ))}
          </div>
        </div>
      );
    }
    return (
      <Link
        key={item.path}
        href={item.path || "#"}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
          pathname === item.path
            ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {item.icon}
        <span>{item.name}</span>
        {item.badge && (
          <Badge className="ml-auto px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? ( <X className="h-6 w-6" /> ) : ( <Menu className="h-6 w-6" /> )}
            </button>
            <button
              className="hidden md:flex text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/houston123-logo.png"
                alt="Houston123 Logo"
                width={140}
                height={40}
                className="h-8 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/next.svg";
                }}
              />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
              title={language === "vi" ? t("header.switch_to_en") : t("header.switch_to_vi")}
            >
              <Globe className="h-5 w-5" />
              <span className="text-xs font-medium uppercase">{language === "vi" ? "VN" : "EN"}</span>
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isDarkMode ? t("header.switch_to_light") : t("header.switch_to_dark")}
            >
              {isDarkMode ? ( <Sun className="h-5 w-5" /> ) : ( <Moon className="h-5 w-5" /> )}
            </button>
            <button className="relative p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside
          className={`hidden md:block bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all ${
            isSidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-3">
              <nav className="flex flex-col space-y-1">
                {/* START FIX: Sử dụng component NavListItem mới */}
                {navItems.map((item) => (
                  <NavListItem
                    key={item.name}
                    item={item}
                    isSidebarCollapsed={isSidebarCollapsed}
                    pathname={pathname}
                  />
                ))}
                {/* END FIX */}
              </nav>

              {!isSidebarCollapsed ? (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3 px-3">
                    {t("sidebar.current_location")}
                  </h3>
                  <div className="space-y-3 px-1">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 px-2 text-xs text-gray-600 dark:text-gray-400">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{t("sidebar.company")}</span>
                      </div>
                      <Select
                        disabled={isCompanyLoading || companies.length === 0}
                        value={selectedCompany || ""}
                        onValueChange={handleCompanySelect}
                      >
                        <SelectTrigger className="w-full text-xs h-8 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          <SelectValue placeholder={t("sidebar.select_company")} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                          {companies.map((company) => (
                            <SelectItem key={company._id} value={company._id} className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 px-2 text-xs text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{t("sidebar.branch")}</span>
                      </div>
                      <Select
                        disabled={ isCompanyLoading || !selectedCompany || branches.length === 0 }
                        value={selectedBranch || ""}
                        onValueChange={handleBranchSelect}
                      >
                        <SelectTrigger className="w-full text-xs h-8 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          <SelectValue placeholder={t("sidebar.select_branch")} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                          {branches.map((branch) => (
                            <SelectItem key={branch._id} value={branch.code} className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 px-3">
                  <div className="flex justify-center">
                    <Building2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex justify-center mt-4">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50 dark:bg-opacity-70"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`md:hidden fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Image
              src="/houston123-logo.png"
              alt="Houston123 Logo"
              width={120}
              height={35}
              className="h-7 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/next.svg";
              }}
            />
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-3">
              <nav className="flex flex-col space-y-1">
                {navItems.map(renderMobileNavItem)}
              </nav>
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3 px-3">
                  {t("sidebar.current_location")}
                </h3>
                <div className="space-y-3 px-1">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 px-2 text-xs text-gray-600 dark:text-gray-400">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{t("sidebar.company")}</span>
                    </div>
                    <Select
                      disabled={isCompanyLoading || companies.length === 0}
                      value={selectedCompany || ""}
                      onValueChange={handleCompanySelect}
                    >
                      <SelectTrigger className="w-full text-xs h-8 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                        <SelectValue placeholder="Chọn công ty" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        {companies.map((company) => (
                          <SelectItem key={company._id} value={company._id} className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 px-2 text-xs text-gray-600 dark:text-gray-400">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{t("sidebar.branch")}</span>
                    </div>
                    <Select
                      disabled={ isCompanyLoading || !selectedCompany || branches.length === 0 }
                      value={selectedBranch || ""}
                      onValueChange={handleBranchSelect}
                    >
                      <SelectTrigger className="w-full text-xs h-8 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                        <SelectValue placeholder={t("sidebar.select_branch")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        {branches.map((branch) => (
                          <SelectItem key={branch._id} value={branch.code} className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <hr className="my-4 border-gray-200 dark:border-gray-700" />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { logout(); }}
                className="w-full justify-center mt-2"
              >
                Đăng xuất
              </Button>
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
            <div className="container mx-auto">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                {breadcrumbs.map((item, index) => (
                  <div key={item.path} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 mx-2 text-gray-400 dark:text-gray-500" />
                    )}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {item.name}
                      </span>
                    ) : (
                      <Link href={item.path} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-6">{children}</div>
        </main>
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 transition-colors">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Houston123 Education. {t("footer.copyright")}
        </div>
      </footer>
    </div>
  );
}