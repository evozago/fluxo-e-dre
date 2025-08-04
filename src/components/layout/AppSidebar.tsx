import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  Calculator,
  FileText,
  Users,
  TrendingUp,
  Package,
  Tag,
  Settings,
  Home,
  Receipt,
  ShoppingCart,
  User,
  Network,
  Banknote,
  History
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Início",
    url: "/dashboard",
    icon: Home,
    section: "main"
  },
  {
    title: "Contas a Pagar",
    url: "/dashboard?tab=payables",
    icon: Calculator,
    section: "financial"
  },
  {
    title: "Vendas",
    url: "/dashboard?tab=sales",
    icon: ShoppingCart,
    section: "financial"
  },
  {
    title: "Relatórios",
    url: "/dashboard?tab=reports",
    icon: FileText,
    section: "financial"
  },
  {
    title: "Bancos",
    url: "/dashboard?tab=banks",
    icon: Banknote,
    section: "financial"
  },
  {
    title: "Fornecedores",
    url: "/dashboard?tab=suppliers",
    icon: Users,
    section: "management"
  },
  {
    title: "Marcas",
    url: "/dashboard?tab=brands",
    icon: Tag,
    section: "management"
  },
  {
    title: "Produtos",
    url: "/dashboard?tab=products",
    icon: Package,
    section: "management"
  },
  {
    title: "Entidades",
    url: "/dashboard?tab=entities",
    icon: Building2,
    section: "management"
  },
  {
    title: "Funcionários",
    url: "/dashboard?tab=employees",
    icon: User,
    section: "management"
  },
  {
    title: "Configurações",
    url: "/dashboard?tab=settings",
    icon: Settings,
    section: "system"
  },
  {
    title: "Organograma",
    url: "/dashboard?tab=organogram",
    icon: Network,
    section: "system"
  },
  {
    title: "Histórico",
    url: "/dashboard?tab=history",
    icon: History,
    section: "system"
  }
];

const sections = {
  main: "Principal",
  financial: "Financeiro",
  management: "Gestão",
  system: "Sistema"
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return currentPath === "/dashboard" || currentPath === "/dashboard?tab=overview";
    }
    return currentPath === url;
  };

  const getNavLinkClass = (url: string) => {
    const active = isActive(url);
    return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
      active
        ? "bg-primary text-primary-foreground font-medium"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;
  };

  const groupedItems = Object.entries(sections).map(([key, label]) => ({
    label,
    items: navigationItems.filter(item => item.section === key)
  }));

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 border-r border-sidebar-border`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-sidebar-foreground">
                Lui Bambini
              </h2>
              <p className="text-xs text-muted-foreground">
                Sistema de Gestão
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {groupedItems.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavLinkClass(item.url)}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}