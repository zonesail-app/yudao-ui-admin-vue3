<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="formData.userId" placeholder="请输入用户ID" />
      </el-form-item>
      <el-form-item label="任务执行ID" prop="taskExecLogId">
        <el-input v-model="formData.taskExecLogId" placeholder="请输入任务执行ID" />
      </el-form-item>
      <el-form-item label="产品ASIN" prop="asin">
        <el-input v-model="formData.asin" placeholder="请输入产品ASIN" />
      </el-form-item>
      <el-form-item label="市场代码" prop="marketplace">
        <el-input v-model="formData.marketplace" placeholder="请输入市场代码" />
      </el-form-item>
      <el-form-item label="BuyBox价格" prop="buyboxPrice">
        <el-input v-model="formData.buyboxPrice" placeholder="请输入BuyBox价格" />
      </el-form-item>
      <el-form-item label="商品价格" prop="price">
        <el-input v-model="formData.price" placeholder="请输入商品价格" />
      </el-form-item>
      <el-form-item label="Prime价格" prop="primePrice">
        <el-input v-model="formData.primePrice" placeholder="请输入Prime价格" />
      </el-form-item>
      <el-form-item label="优惠券价格" prop="couponPrice">
        <el-input v-model="formData.couponPrice" placeholder="请输入优惠券价格" />
      </el-form-item>
      <el-form-item label="优惠券折扣" prop="couponDiscount">
        <el-input v-model="formData.couponDiscount" placeholder="请输入优惠券折扣" />
      </el-form-item>
      <el-form-item label="促销价格" prop="dealPrice">
        <el-input v-model="formData.dealPrice" placeholder="请输入促销价格" />
      </el-form-item>
      <el-form-item label="促销信息" prop="dealInfo">
        <el-input v-model="formData.dealInfo" placeholder="请输入促销信息" />
      </el-form-item>
      <el-form-item label="FBA价格" prop="fbaPrice">
        <el-input v-model="formData.fbaPrice" placeholder="请输入FBA价格" />
      </el-form-item>
      <el-form-item label="FBM价格" prop="fbmPrice">
        <el-input v-model="formData.fbmPrice" placeholder="请输入FBM价格" />
      </el-form-item>
      <el-form-item label="标价" prop="listPrice">
        <el-input v-model="formData.listPrice" placeholder="请输入标价" />
      </el-form-item>
      <el-form-item label="抓取时间" prop="scrapedAt">
        <el-date-picker
          v-model="formData.scrapedAt"
          type="date"
          value-format="x"
          placeholder="选择抓取时间"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ListingPriceApi, ListingPrice } from '@/api/amazon/listingprice'

/** 价格监控结果 表单 */
defineOptions({ name: 'ListingPriceForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  userId: undefined,
  taskExecLogId: undefined,
  asin: undefined,
  marketplace: undefined,
  buyboxPrice: undefined,
  price: undefined,
  primePrice: undefined,
  couponPrice: undefined,
  couponDiscount: undefined,
  dealPrice: undefined,
  dealInfo: undefined,
  fbaPrice: undefined,
  fbmPrice: undefined,
  listPrice: undefined,
  scrapedAt: undefined,
  remark: undefined
})
const formRules = reactive({
  userId: [{ required: true, message: '用户ID不能为空', trigger: 'blur' }],
  taskExecLogId: [{ required: true, message: '任务执行ID不能为空', trigger: 'blur' }],
  asin: [{ required: true, message: '产品ASIN不能为空', trigger: 'blur' }],
  marketplace: [{ required: true, message: '市场代码不能为空', trigger: 'blur' }],
  scrapedAt: [{ required: true, message: '抓取时间不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ListingPriceApi.getListingPrice(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ListingPrice
    if (formType.value === 'create') {
      await ListingPriceApi.createListingPrice(data)
      message.success(t('common.createSuccess'))
    } else {
      await ListingPriceApi.updateListingPrice(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    userId: undefined,
    taskExecLogId: undefined,
    asin: undefined,
    marketplace: undefined,
    buyboxPrice: undefined,
    price: undefined,
    primePrice: undefined,
    couponPrice: undefined,
    couponDiscount: undefined,
    dealPrice: undefined,
    dealInfo: undefined,
    fbaPrice: undefined,
    fbmPrice: undefined,
    listPrice: undefined,
    scrapedAt: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>