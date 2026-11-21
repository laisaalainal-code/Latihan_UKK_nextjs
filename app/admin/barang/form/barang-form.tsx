'use client'
 
import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
 
type BarangFormBarang = {
  id: number
  nama: string
  stok: number
  harga: number
}
 
type BarangFormProps = {
  barangId?: string
}
 
export function BarangForm({ barangId }: BarangFormProps) {
  const router = useRouter()
  const [barang, setBarang] = useState<BarangFormBarang| null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(barangId))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [nama, setNama] = useState("")
  const [stok, setStok] = useState("0")
  const [harga, setHarga] = useState("0")
 
  useEffect(() => {
    if (!barangId) return
 
    let isActive = true
    async function loadBarang() {
      try {
        const response = await fetch(`/api/barang/${barangId}`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? "Gagal memuat Barang.")
 
       const data = result.item ?? result.barang
        if (isActive && data) {
          setBarang(data)
          setNama(data.nama ?? "")
          setStok(String(data.stok ?? 0))
          setHarga(String(data.harga ?? 0))
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat Barang.")
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
 
    void loadBarang()
    return () => {
      isActive = false
    }
  }, [barangId])
 
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(barangId ? `/api/barang/${barangId}` : "/api/barang", {
        method: barangId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
         stok: Number(stok.trim()),
         harga: Number(harga.trim()),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Gagal menyimpan Barang.")
      router.push("/admin/barang")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan Barang.")
    } finally {
      setIsSaving(false)
    }
  }
 
  return (
    <Card className="m-6 px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{barangId ? "Edit barang" : "Tambah barang"}</h1>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/barang")}>
          <ArrowLeft aria-hidden="true" />
          Kembali
        </Button>
      </div>
 
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Memuat barang...</p>
      ) : barangId && !barang ? null : (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 rounded-md border p-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="nama" className="text-sm font-medium">Nama barang</label>
            <Input id="nama" value={nama} onChange={(event) => setNama(event.target.value)} required maxLength={191} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="stok" className="text-sm font-medium">stok</label>
            <Input id="stok" type="number" value={stok} onChange={(event) => setStok(event.target.value)} required maxLength={191} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="harga" className="text-sm font-medium">harga</label>
            <Input id="harga" type="number" value={harga} onChange={(event) => setHarga(event.target.value)} required maxLength={191} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/barang")} disabled={isSaving}>
              <X aria-hidden="true" />
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : barang ? "Simpan perubahan" : "Buat barang"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}