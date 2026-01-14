import type { Step } from "react-joyride";

export const usersTourSteps: Step[] = [
  {
    target: "body",
    content:
      "ຍິນດີຕ້ອນຮັບສູ່ຫນ້າຈັດການຜູ້ໃຊ້! ຫນ້ານີ້ຊ່ວຍທ່ານຈັດການຜູ້ໃຊ້ໃນລະບົບ ທ່ານສາມາດສ້າງ, ແກ້ໄຂ, ລຶບ, ຫຼືລະງັບຜູ້ໃຊ້ໄດ້. ທ່ານຈະໄດ້ຮຽນຮູ້ວິທີໃຊ້ງານຫນ້ານີ້ໃນບົດສອນສັ້ນໆນີ້.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tourid="users-toolbar"]',
    content: "ນີ້ແມ່ນປຸ່ມສ້າງຜູ້ໃຊ້ໃໝ່. ກົດປຸ່ມນີ້ເພື່ອເລີ່ມສ້າງຜູ້ໃຊ້ທີ່ທ່ານຕ້ອງການ.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="users-filter"]',
    content:
      "ນີ້ແມ່ນພາກການກອງຂໍ້ມູນ. ທ່ານສາມາດຄົ້ນຫາຜູ້ໃຊ້ຕາມຊື່, ອີເມວ, ບົດບາດ, ຫຼືສະຖານະ. ກົດປຸ່ມ 'ລ້າງ' ເພື່ອລຶບການກອງທັງໝົດ.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="users-table"]',
    content:
      "ນີ້ແມ່ນຕາຕະລາງສະແດງຜູ້ໃຊ້ທັງໝົດ. ທ່ານສາມາດເບິ່ງລາຍລະອຽດ, ແກ້ໄຂ, ລະງັບ, ຫຼືລຶບຜູ້ໃຊ້ໄດ້ຈາກປຸ່ມການກະທໍາທີ່ຢູ່ທາງຂວາແຖວຂອງແຕ່ລະຜູ້ໃຊ້.",
    placement: "top",
  },
];
