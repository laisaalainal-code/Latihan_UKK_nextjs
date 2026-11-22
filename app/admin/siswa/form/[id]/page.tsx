import { SiswaForm } from "../siswa-form";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;

  return <SiswaForm siswaId={id} />;
}