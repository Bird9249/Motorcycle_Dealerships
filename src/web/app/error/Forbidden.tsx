import { Link } from "@tanstack/react-router";

export function Forbidden() {
  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-2 font-semibold text-2xl">ບໍ່ອະນຸຍາດ</h1>
      <p className="mb-4 text-muted-foreground">ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້.</p>
      <Link to="/" className="underline">
        ກັບໄປໜ້າຫຼັກ
      </Link>
    </div>
  );
}
