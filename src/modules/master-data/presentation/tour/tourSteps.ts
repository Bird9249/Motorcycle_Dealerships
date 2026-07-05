import type { Step } from "react-joyride";

export const masterDataTourSteps: Step[] = [
  {
    target: "body",
    content:
      "ຍິນດີຕ້ອນຮັບສູ່ຫນ້າຂໍ້ມູນຫຼັກ! ຈັດການຍີ່ຫໍ້, ລຸ່ນ ແລະ ສີທີ່ໃຊ້ໃນລະບົບສິນຄ້າຄົງຄັງ. ບົດສອນນີ້ຈະແນະນຳວິທີໃຊ້ງານຫນ້ານີ້.",
    placement: "center",
    skipBeacon: true,
  },
  {
    target: '[data-tourid="master-data-tabs"]',
    content:
      "ສະຫຼັບແທັບເພື່ອຈັດການຍີ່ຫໍ້, ລຸ່ນ (ICE/EV) ແລະ ສີແຍກກັນ.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="master-data-toolbar"]',
    content:
      "ປຸ່ມເພີ່ມໃໝ່ຢູ່ມຸມຂວາຂອງແຕ່ລະແທັບ — ຕ້ອງມີສິດ master-data:create.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="master-data-filter"]',
    content:
      "ຄົ້ນຫາຕາມຊື່ ແລະ ກອງຕາມສະຖານະ (ໃຊ້ງານ / ປິດ). ແທັບລຸ່ນມີ filter ຍີ່ຫໍ້ ແລະ ປະເພດ ICE/EV ເພີ່ມ.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="master-data-table"]',
    content:
      "ຕາຕະລາງສະແດງລາຍການ — ສາມາດເປີດ/ປິດສະຖານະ, ແກ້ໄຂ ແລະ ເບິ່ງຈຳນວນລຸ່ນ/ລົດທີ່ອ້າງອີງ.",
    placement: "top",
  },
];
