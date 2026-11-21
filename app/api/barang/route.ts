import { NextResponse } from "next/server"
import { Prisma } from "@/src/generated/prisma/client"
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

// =========================================================================
// PEMBUATAN AUTO NUMBER DI BACKEND (API)
// Mencari kode terakhir di database, mengambil angkanya, lalu + 1
// =========================================================================
async function generateKodeBarang(tx: Prisma.TransactionClient) {
  const prefix = "BRG"

  const lastBarang = await tx.barang.findFirst({
    where: {
      kode: { startsWith: prefix },
    },
    orderBy: {
      kode: "desc",
    },
    select: { kode: true },
  })

  if (!lastBarang || !lastBarang.kode) {
    return `${prefix}0000001`
  }

  const numericPart = lastBarang.kode.slice(prefix.length)
  const lastNumber = Number.parseInt(numericPart, 10)
  const nextNumber = Number.isNaN(lastNumber) ? 1 : lastNumber + 1

  return `${prefix}${String(nextNumber).padStart(7, "0")}`
}

export async function GET(request: Request) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json(
      { error: "Silakan login untuk melanjutkan." },
      { status: 401 }
    )
  }

  const searchParams = new URL(request.url).searchParams
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10)
  const requestedPageSize = Number.parseInt(
    searchParams.get("pageSize") ?? "10",
    10
  )
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(100, Math.max(1, requestedPageSize))
    : 10

  try {
    const totalBarang = await prisma.barang.count()
    const totalPages = Math.max(1, Math.ceil(totalBarang / pageSize))
    const page =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.min(requestedPage, totalPages)
        : 1

    const barang = await prisma.barang.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: barangFields,
    })

    return NextResponse.json({
      items: barang,
      pagination: { page, pageSize, totalBarang, totalPages },
    })
  } catch (error) {
    console.error("Failed to fetch barang:", error)
    return NextResponse.json(
      { error: "Gagal memuat data barang." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
 const currentUser = await getAuthenticatedUser()
if (!currentUser) {
  return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
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

  if (!nama) {
    return NextResponse.json(
      { error: "Nama barang wajib diisi." },
      { status: 400 }
    )
  }

  if (Number.isNaN(stok) || stok < 0) {
    return NextResponse.json(
      { error: "Stok harus berupa angka valid (minimal 0)." },
      { status: 400 }
    )
  }

  if (Number.isNaN(harga) || harga < 0) {
    return NextResponse.json(
      { error: "Harga harus berupa angka valid (minimal 0)." },
      { status: 400 }
    )
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const kode = await generateKodeBarang(tx)

      return tx.barang.create({
        data: {
          kode,
          nama,
          stok,
          harga,
        },
        select: barangFields,
      })
    })

    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    console.error("Failed to create barang:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan data barang." },
      { status: 500 }
    )
  }
}