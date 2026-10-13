import { FeatureHeader } from "@/components/admin/FeatureHeader";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { featuresOf, getSettings, splitMessages } from "@/lib/data";

export const metadata = { title: "Announcement Bar" };

export default async function AnnouncementFeature() {
  const st = await getSettings();
  return (
    <>
      <FeatureHeader feature="announcement" on={featuresOf(st).announcement} title="Announcement Bar" sub="The moving strip of messages at the very top of the website." offNote="The bar is hidden. Your messages and dates are kept for when you turn it back on." />
      <AnnouncementForm messages={splitMessages(st.announcement)} start={st.announcementStart} end={st.announcementEnd} />
    </>
  );
}
