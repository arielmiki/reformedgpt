import { Avatar, Button } from 'antd';
import { UserOutlined, RobotOutlined, FileTextOutlined } from '@ant-design/icons';

export default function Message({ role, content, onShowPdf }) {
  const isUser = role === 'user';

  return (
    <div className={`flex items-start my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <Avatar icon={<RobotOutlined />} className="mr-3" />}
      <div
        className={`max-w-[80%] p-3 rounded-lg ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
        {Array.isArray(content) ? (
          content.map((segment, index) => {
            if (segment.type === 'citation') {
              return (
                <span
                  key={index}
                  onClick={() => onShowPdf(segment.source)}
                  style={{ color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {segment.value}
                </span>
              );
            }
            return <span key={index}>{segment.value}</span>;
          })
        ) : (
          content
        )}
      </div>
      {isUser && <Avatar icon={<UserOutlined />} className="ml-3" />}
    </div>
  );
}
