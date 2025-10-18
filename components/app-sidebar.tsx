"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useI18n } from "@/components/i18n-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const baseData = {
  user: {
    name: "",
    email: "",
    avatar: "",
  },
  navMain: [
    { title: "", url: "/dashboard", icon: IconDashboard },
    { title: "", url: "#", icon: IconListDetails },
    { title: "", url: "#", icon: IconChartBar },
    { title: "", url: "#", icon: IconFolder },
    { title: "", url: "#", icon: IconUsers },
  ],
  navClouds: [
    { title: "", icon: IconCamera, isActive: true, url: "#", items: [{ title: "", url: "#" }, { title: "", url: "#" }] },
    { title: "", icon: IconFileDescription, url: "#", items: [{ title: "", url: "#" }, { title: "", url: "#" }] },
    { title: "", icon: IconFileAi, url: "#", items: [{ title: "", url: "#" }, { title: "", url: "#" }] },
  ],
  navSecondary: [
    // title is injected via i18n below
    { title: "", url: "/settings", icon: IconSettings },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    { name: "", url: "#", icon: IconDatabase },
    { name: "", url: "#", icon: IconReport },
    { name: "", url: "#", icon: IconFileWord },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useI18n()
  const data = React.useMemo(() => {
    return {
      ...baseData,
      navSecondary: [
        { ...baseData.navSecondary[0], title: t("common.settings") },
        { ...baseData.navSecondary[1], title: t("nav.getHelp") },
        { ...baseData.navSecondary[2], title: t("nav.search") },
      ],
      navMain: [
        { ...baseData.navMain[0], title: t("nav.dashboard") },
        { ...baseData.navMain[1], title: t("nav.lifecycle") },
        { ...baseData.navMain[2], title: t("nav.analytics") },
        { ...baseData.navMain[3], title: t("nav.projects") },
        { ...baseData.navMain[4], title: t("nav.team") },
      ],
      navClouds: [
        {
          ...baseData.navClouds[0],
          title: t("nav.clouds.capture"),
          items: [
            { ...baseData.navClouds[0].items[0], title: t("nav.clouds.items.active") },
            { ...baseData.navClouds[0].items[1], title: t("nav.clouds.items.archived") },
          ],
        },
        {
          ...baseData.navClouds[1],
          title: t("nav.clouds.proposal"),
          items: [
            { ...baseData.navClouds[1].items[0], title: t("nav.clouds.items.active") },
            { ...baseData.navClouds[1].items[1], title: t("nav.clouds.items.archived") },
          ],
        },
        {
          ...baseData.navClouds[2],
          title: t("nav.clouds.prompts"),
          items: [
            { ...baseData.navClouds[2].items[0], title: t("nav.clouds.items.active") },
            { ...baseData.navClouds[2].items[1], title: t("nav.clouds.items.archived") },
          ],
        },
      ],
      documents: [
        { ...baseData.documents[0], name: t("nav.documents.dataLibrary") },
        { ...baseData.documents[1], name: t("nav.documents.reports") },
        { ...baseData.documents[2], name: t("nav.documents.wordAssistant") },
      ],
    }
  }, [t])
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">{t("common.appName")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* Template: no Apps section in the sidebar */}
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
