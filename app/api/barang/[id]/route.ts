import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const barangFields = {
  id: true,
  kode: true,
  nama: true,
  stok: true,
  harga: true,
  createdAt: true,
  updatedAt: true,
} as const

type RouteContext = { params: Promise<{ id: string }> }

function isMissingBarang(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025"
}

async function getBarangId(context: RouteContext) {
  const { id } = await context.params
  const barangId = Number(id)
  return Number.isInteger(barangId) && barangId > 0 ? barangId : null
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const barangId = await getBarangId(context)
  if (!barangId) {
    return NextResponse.json({ error: "ID barang tidak valid." }, { status: 400 })
  }

  try {
    const barang = await prisma.barang.findUnique({
      where: { id: barangId },
      select: barangFields,
    })
    if (!barang) {
      return NextResponse.json({ error: "Barang tidak ditemukan." }, { status: 404 })
    }

    return NextResponse.json({ item: barang })
  } catch (error) {
    console.error("Failed to fetch barang:", error)
    return NextResponse.json({ error: "Gagal memuat data barang." }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const barangId = await getBarangId(context)
  if (!barangId) {
    return NextResponse.json({ error: "ID barang tidak valid." }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 })
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : ""
  const stok = Number(body.stok ?? 0)
  const harga = Number(body.harga ?? 0)

  if (!nama || nama.length > 191) {
    return NextResponse.json({ error: "Nama barang tidak valid." }, { status: 400 })
  }
  if (!Number.isInteger(stok) || stok < 0) {
    return NextResponse.json(
      { error: "Stok harus berupa bilangan bulat valid (minimal 0)." },
      { status: 400 }
    )
  }
  if (!Number.isInteger(harga) || harga < 0) {
    return NextResponse.json(
      { error: "Harga harus berupa bilangan bulat valid (minimal 0)." },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.barang.update({
      where: { id: barangId },
      data: {
        nama,
        stok,
        harga,
      },
      select: barangFields,
    })
    return NextResponse.json({ item: updated })
  } catch (error) {
    if (isMissingBarang(error)) {
      return NextResponse.json({ error: "Barang tidak ditemukan." }, { status: 404 })
    }
    console.error("Failed to update barang:", error)
    return NextResponse.json(
      { error: "Gagal memperbarui barang. Periksa koneksi database." },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const barangId = await getBarangId(context)
  if (!barangId) {
    return NextResponse.json({ error: "ID barang tidak valid." }, { status: 400 })
  }

  try {
    await prisma.barang.delete({ where: { id: barangId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isMissingBarang(error)) {
      return NextResponse.json({ error: "Barang tidak ditemukan." }, { status: 404 })
    }
    console.error("Failed to delete barang:", error)
    return NextResponse.json({ error: "Gagal menghapus barang." }, { status: 500 })
  }
}