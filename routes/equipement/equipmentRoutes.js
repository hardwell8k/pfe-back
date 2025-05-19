const express = require('express');

const {addEquipment,updateEquipment,getAllEquipment,deleteEquipment} = require('../../controllers/equipement/equipementController');
const {addCategory,addSubCategory,getCategory,updateCategory,updateSubCategory,deleteCategory,deleteSubCategory} = require('../../controllers/equipement/equipment-category/equipementCategoryController')

const router = express.Router();

router.post('/addEquipment',addEquipment);
router.post('/addCategory',addCategory);
router.post('/addSubCategory',addSubCategory);

router.put('/updateEquipment',updateEquipment);
router.put('/updateCategory',updateCategory);
router.put('/updateSubCategory',updateSubCategory);

router.post('/getAllEquipment',getAllEquipment);
router.get('/getCategory',getCategory);

router.delete('/deleteEquipment',deleteEquipment)
router.delete('/deleteCategory',deleteCategory)
router.delete('/deleteSubCategory',deleteSubCategory)

module.exports = router;