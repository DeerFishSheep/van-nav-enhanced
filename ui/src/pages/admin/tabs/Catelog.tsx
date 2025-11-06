import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tooltip,
  Switch,
  Collapse,
} from "antd";
import { QuestionCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useCallback, useState } from "react";
import {
  fetchAddCateLog,
  fetchDeleteCatelog,
  fetchUpdateCateLog,
  fetchAddSubCatelog,
  fetchDeleteSubCatelog,
  fetchUpdateSubCatelog,
} from "../../../utils/api";
import { useData } from "../hooks/useData";

const { Panel } = Collapse;

export interface CatelogProps {}
export const Catelog: React.FC<CatelogProps> = (props) => {
  const { store, loading, reload } = useData();
  const [requestLoading, setRequestLoading] = useState(false);
  const [addForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [subAddForm] = Form.useForm();
  const [subUpdateForm] = Form.useForm();
  const [showAddModel, setShowAddModel] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSubAddModal, setShowSubAddModal] = useState(false);
  const [showSubEditModal, setShowSubEditModal] = useState(false);
  const [currentCatelogId, setCurrentCatelogId] = useState<number | null>(null);

  // 大分类操作
  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await fetchDeleteCatelog(id);
        message.success("删除分类成功!");
      } catch (err: any) {
        const errorMsg = err?.response?.data?.errorMessage || err?.message || "删除分类失败!";
        message.error(errorMsg);
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleCreate = useCallback(
    async (record: any) => {
      try {
        await fetchAddCateLog(record);
        message.success("添加成功!");
      } catch (err) {
        message.warning("添加失败!");
      } finally {
        setShowAddModel(false);
        reload();
      }
    },
    [reload, setShowAddModel]
  );

  const handleUpdate = useCallback(
    async (record: any) => {
      setRequestLoading(true);
      try {
        await fetchUpdateCateLog(record);
        message.success("更新成功! ");
        setTimeout(() => {
          reload();
        }, 3000);
      } catch (err) {
        message.warning("更新失败!");
      } finally {
        setRequestLoading(false);
        setShowEdit(false);
        reload();
      }
    },
    [reload, setShowEdit, setRequestLoading]
  );

  // 子分类操作
  const handleSubDelete = useCallback(
    async (id: number) => {
      try {
        await fetchDeleteSubCatelog(id);
        message.success("删除子分类成功!");
      } catch (err: any) {
        const errorMsg = err?.response?.data?.errorMessage || err?.message || "删除子分类失败!";
        message.error(errorMsg);
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleSubCreate = useCallback(
    async (record: any) => {
      try {
        await fetchAddSubCatelog({ ...record, catelogId: currentCatelogId });
        message.success("添加子分类成功!");
      } catch (err) {
        message.warning("添加子分类失败!");
      } finally {
        setShowSubAddModal(false);
        subAddForm.resetFields();
        reload();
      }
    },
    [reload, currentCatelogId, subAddForm]
  );

  const handleSubUpdate = useCallback(
    async (record: any) => {
      setRequestLoading(true);
      try {
        await fetchUpdateSubCatelog(record);
        message.success("更新子分类成功!");
      } catch (err) {
        message.warning("更新子分类失败!");
      } finally {
        setRequestLoading(false);
        setShowSubEditModal(false);
        reload();
      }
    },
    [reload]
  );

  // 获取某个大分类下的子分类
  const getSubCatelogs = (catelogId: number) => {
    if (!store?.subcatelogs) return [];
    return store.subcatelogs.filter((sub: any) => sub.catelogId === catelogId);
  };

  return (
    <Card
      title={`当前共 ${store?.catelogs?.length ?? 0} 个大分类`}
      extra={
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setShowAddModel(true);
            }}
          >
            添加大分类
          </Button>
          <Button
            type="primary"
            onClick={() => {
              reload();
            }}
          >
            刷新
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Collapse defaultActiveKey={[]}>
          {(store?.catelogs || []).map((catelog: any) => (
            <Panel
              header={
                <Space>
                  <strong>{catelog.name}</strong>
                  <span style={{ color: '#999' }}>
                    (排序: {catelog.sort}, 隐藏: {catelog.hide ? '是' : '否'})
                  </span>
                </Space>
              }
              key={catelog.id}
              extra={
                <Space onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      updateForm.setFieldsValue(catelog);
                      setShowEdit(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Popconfirm
                    onConfirm={() => {
                      handleDelete(catelog.id);
                    }}
                    title={`确定要删除大分类 ${catelog.name} 吗？`}
                  >
                    <Button size="small" type="link" danger>
                      删除
                    </Button>
                  </Popconfirm>
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setCurrentCatelogId(catelog.id);
                      subAddForm.resetFields();
                      setShowSubAddModal(true);
                    }}
                  >
                    添加子分类
                  </Button>
                </Space>
              }
            >
              <Table
                dataSource={getSubCatelogs(catelog.id)}
                rowKey="id"
                size="small"
                pagination={false}
              >
                <Table.Column title="ID" dataIndex="id" width={80} />
                <Table.Column title="子分类名称" dataIndex="name" />
                <Table.Column
                  title={
                    <span>
                      排序
                      <Tooltip title="升序，按数字从小到大排序">
                        <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                      </Tooltip>
                    </span>
                  }
                  dataIndex="sort"
                  width={100}
                />
                <Table.Column
                  title="隐藏"
                  dataIndex="hide"
                  width={80}
                  render={(val) => (Boolean(val) ? "是" : "否")}
                />
                <Table.Column
                  title="操作"
                  width={150}
                  render={(_, record: any) => (
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          subUpdateForm.setFieldsValue(record);
                          setShowSubEditModal(true);
                        }}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        onConfirm={() => {
                          handleSubDelete(record.id);
                        }}
                        title={`确定要删除子分类 ${record.name} 吗？`}
                      >
                        <Button type="link" size="small" danger>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  )}
                />
              </Table>
              {getSubCatelogs(catelog.id).length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  暂无子分类，点击上方"添加子分类"按钮创建
                </div>
              )}
            </Panel>
          ))}
        </Collapse>
      </Spin>

      {/* 添加大分类模态框 */}
      <Modal
        open={showAddModel}
        title={"新建大分类"}
        onCancel={() => {
          setShowAddModel(false);
        }}
        onOk={() => {
          const values = addForm?.getFieldsValue();
          handleCreate(values);
        }}
      >
        <Form form={addForm}>
          <Form.Item name="name" required label="名称" labelCol={{ span: 4 }}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="sort"
            required
            initialValue={0}
            label={
              <span>
                <Tooltip title="升序，按数字从小到大排序">
                  <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                </Tooltip>
                &nbsp;排序
              </span>
            }
            labelCol={{ span: 4 }}
          >
            <InputNumber
              placeholder="默认排在最后，可手动指定"
              type="number"
              defaultValue={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="hide"
            initialValue={false}
            required
            label={
              <span>
                <Tooltip title="开启后只有登录后才会展示该分类">
                  <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                </Tooltip>
                &nbsp;隐藏
              </span>
            }
            labelCol={{ span: 4 }}
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑大分类模态框 */}
      <Modal
        open={showEdit}
        title={"修改大分类"}
        onCancel={() => {
          setShowEdit(false);
        }}
        onOk={() => {
          const values = updateForm?.getFieldsValue();
          handleUpdate(values);
        }}
      >
        <Spin spinning={requestLoading}>
          <Form form={updateForm}>
            <Form.Item name="id" label="序号" labelCol={{ span: 4 }}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="name" required label="名称" labelCol={{ span: 4 }}>
              <Input placeholder="请输入分类名称" />
            </Form.Item>
            <Form.Item
              name="sort"
              required
              label={
                <span>
                  <Tooltip title="升序，按数字从小到大排序">
                    <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                  </Tooltip>
                  &nbsp;排序
                </span>
              }
              labelCol={{ span: 4 }}
            >
              <InputNumber placeholder="请输入分类排序" defaultValue={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="hide"
              required
              label={
                <span>
                  <Tooltip title="开启后只有登录后才会展示该分类">
                    <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                  </Tooltip>
                  &nbsp;隐藏
                </span>
              }
              labelCol={{ span: 4 }}
            >
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* 添加子分类模态框 */}
      <Modal
        open={showSubAddModal}
        title={"添加子分类"}
        onCancel={() => {
          setShowSubAddModal(false);
          subAddForm.resetFields();
        }}
        onOk={() => {
          const values = subAddForm?.getFieldsValue();
          handleSubCreate(values);
        }}
      >
        <Form form={subAddForm}>
          <Form.Item name="name" required label="名称" labelCol={{ span: 4 }}>
            <Input placeholder="请输入子分类名称" />
          </Form.Item>
          <Form.Item
            name="sort"
            required
            initialValue={0}
            label={
              <span>
                <Tooltip title="升序，按数字从小到大排序">
                  <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                </Tooltip>
                &nbsp;排序
              </span>
            }
            labelCol={{ span: 4 }}
          >
            <InputNumber
              placeholder="默认排在最后，可手动指定"
              type="number"
              defaultValue={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="hide"
            initialValue={false}
            required
            label={
              <span>
                <Tooltip title="开启后只有登录后才会展示该子分类">
                  <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                </Tooltip>
                &nbsp;隐藏
              </span>
            }
            labelCol={{ span: 4 }}
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑子分类模态框 */}
      <Modal
        open={showSubEditModal}
        title={"修改子分类"}
        onCancel={() => {
          setShowSubEditModal(false);
        }}
        onOk={() => {
          const values = subUpdateForm?.getFieldsValue();
          handleSubUpdate(values);
        }}
      >
        <Spin spinning={requestLoading}>
          <Form form={subUpdateForm}>
            <Form.Item name="id" label="序号" labelCol={{ span: 4 }}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="catelogId" label="所属大分类ID" labelCol={{ span: 6 }}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="name" required label="名称" labelCol={{ span: 4 }}>
              <Input placeholder="请输入子分类名称" />
            </Form.Item>
            <Form.Item
              name="sort"
              required
              label={
                <span>
                  <Tooltip title="升序，按数字从小到大排序">
                    <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                  </Tooltip>
                  &nbsp;排序
                </span>
              }
              labelCol={{ span: 4 }}
            >
              <InputNumber placeholder="请输入子分类排序" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="hide"
              required
              label={
                <span>
                  <Tooltip title="开启后只有登录后才会展示该子分类">
                    <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                  </Tooltip>
                  &nbsp;隐藏
                </span>
              }
              labelCol={{ span: 4 }}
            >
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </Card>
  );
};
