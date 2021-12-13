import styles from './index.less';
import { Input, Button } from 'antd';

export default function IndexPage() {
  return (
    <div>
      <Input.Group compact>
        <Input style={{ width: 'calc(100% - 200px)' }} placeholder="url地址" />
        <Button type="primary">抓</Button>
      </Input.Group>
    </div>
  );
}
