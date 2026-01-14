import type { Step } from "react-joyride";

export const mediaTourSteps: Step[] = [
  {
    target: "body",
    content:
      "ຍິນດີຕ້ອນຮັບສູ່ຫນ້າຈັດການສື່! ຫນ້ານີ້ຊ່ວຍທ່ານຈັດການຟາຍສື່ (ຮູບພາບ, ເອກະສານ) ໃນລະບົບ ທ່ານສາມາດອັບໂຫຼດ, ແກ້ໄຂ, ເກັບໄວ້, ຫຼືລຶບສື່ໄດ້. ທ່ານຈະໄດ້ຮຽນຮູ້ວິທີໃຊ້ງານຫນ້ານີ້ໃນບົດສອນສັ້ນໆນີ້.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tourid="media-toolbar"]',
    content: "ນີ້ແມ່ນປຸ່ມອັບໂຫຼດສື່. ກົດປຸ່ມນີ້ເພື່ອເລີ່ມອັບໂຫຼດຟາຍສື່ໃໝ່.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="media-filter"]',
    content:
      "ນີ້ແມ່ນພາກການກອງຂໍ້ມູນ. ທ່ານສາມາດຄົ້ນຫາສື່ຕາມຊື່ຟາຍ, alt text, ປະເພດ, ຜູ້ອັບໂຫຼດ, ຫຼືສະຖານະ. ກົດປຸ່ມ 'ລ້າງ' ເພື່ອລຶບການກອງທັງໝົດ.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="media-table"]',
    content:
      "ນີ້ແມ່ນຕາຕະລາງສະແດງສື່ທັງໝົດ. ທ່ານສາມາດເບິ່ງລາຍລະອຽດ, ແກ້ໄຂ, ເກັບໄວ້, ຫຼືລຶບສື່ໄດ້ຈາກປຸ່ມການກະທໍາທີ່ຢູ່ທາງຂວາແຖວຂອງແຕ່ລະສື່.",
    placement: "top",
  },
];
