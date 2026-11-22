import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const siswaFields = {
  id: true,
  kode: true,
  nama: true,
  nis: true,
  kelas: true,
  alamat: true,
  createdAt: true,
  updatedAt: true,
} as const

type RouteContext = { params: Promise<{ id: string }> }

function isMissingSiswa(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025"
}

async function getSiswaId(context: RouteContext) {
  const { id } = await context.params
  const siswaId = Number(id)
  return Number.isInteger(siswaId) && siswaId > 0 ? siswaId : null
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const siswaId = await getSiswaId(context)
  if (!siswaId) {
    return NextResponse.json({ error: "ID siswa tidak valid." }, { status: 400 })
  }

  try {
    const siswa = await prisma.siswa.findUnique({
      where: { id: siswaId },
      select: siswaFields,
    })
    if (!siswa) {
      return NextResponse.json({ error: "siswa tidak ditemukan." }, { status: 404 })
    }

    return NextResponse.json({ item: siswa })
  } catch (error) {
    console.error("Failed to fetch siswa:", error)
    return NextResponse.json({ error: "Gagal memuat data siswa." }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const siswaId = await getSiswaId(context)
  if (!siswaId) {
    return NextResponse.json({ error: "ID siswa tidak valid." }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 })
  }

 
  const nama = typeof body.nama === "string" ? body.nama.trim() : ""
  const nis = typeof body.nis === "string" ? body.nis.trim() : ""
  const kelas = typeof body.kelas === "string" ? body.kelas.trim() : ""
  const alamat = typeof body.alamat === "string" ? body.alamat.trim() : ""

  if (!nama || nama.length > 191) {
    return NextResponse.json({ error: "Nama siswa tidak valid." }, { status: 400 })
  }
  if (!nis || nis.length > 191) {
    return NextResponse.json({ error: "Nis siswa tidak valid." }, { status: 400 })
  }
  if (!kelas || kelas.length > 191) {
    return NextResponse.json({ error: "kelas siswa tidak valid." }, { status: 400 })
  }
  if (!alamat || alamat.length > 191) {
    return NextResponse.json({ error: "Alamat siswa tidak valid." }, { status: 400 })
  }
  

  try {
    const updated = await prisma.siswa.update({
      where: { id: siswaId },
      data: {
          nama,
          nis,
          alamat,
          kelas,
      },
      select: siswaFields,
    })
    return NextResponse.json({ item: updated })
  } catch (error) {
    if (isMissingSiswa(error)) {
      return NextResponse.json({ error: "siswa tidak ditemukan." }, { status: 404 })
    }
    console.error("Failed to update siswa:", error)
    return NextResponse.json(
      { error: "Gagal memperbarui siswa. Periksa koneksi database." },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const siswaId = await getSiswaId(context)
  if (!siswaId) {
    return NextResponse.json({ error: "ID siswa tidak valid." }, { status: 400 })
  }

  try {
    await prisma.siswa.delete({ where: { id: siswaId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isMissingSiswa(error)) {
      return NextResponse.json({ error: "siswa tidak ditemukan." }, { status: 404 })
    }
    console.error("Failed to delete siswa:", error)
    return NextResponse.json({ error: "Gagal menghapus siswa." }, { status: 500 })
  }
}