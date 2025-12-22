// // layouts/UserLayout.tsx
// import React, { useState } from 'react';
// import { Layout, Menu, Button, Input, Avatar, Badge, Dropdown, Space, Typography, Drawer, MenuProps } from 'antd';
// import { 
//   HomeOutlined, 
//   BookOutlined, 
//   FireOutlined, 
//   StarOutlined,
//   UserOutlined,
//   BellOutlined,
//   SearchOutlined,
//   PlusOutlined,
//   MenuOutlined,
//   GlobalOutlined,
//   CrownOutlined,
//   LogoutOutlined,
//   SettingOutlined,
//   HeartOutlined,
//   HistoryOutlined
// } from '@ant-design/icons';
// import { Outlet, NavLink, useNavigate } from 'react-router-dom';
// import { useAuthStore } from '@/client/stores/auth';

// const { Header, Sider, Content } = Layout;
// const { Search } = Input;
// const { Text } = Typography;

// const UserLayout: React.FC = () => {
//   const [collapsed, setCollapsed] = useState(false);
//   const { user } = useAuthStore();
//   const navigate = useNavigate();

//   const userMenuItems: MenuProps['items'] = [
//   {
//     key: 'profile',
//     icon: <UserOutlined />,
//     label: 'Profile',
//     onClick: () => navigate('/profile'),
//   },
//   {
//     key: 'reading-list',
//     icon: <BookOutlined />,
//     label: 'Reading List',
//     onClick: () => navigate('/reading-list'),
//   },
//   {
//     key: 'achievements',
//     icon: <CrownOutlined />,
//     label: 'Achievements',
//     onClick: () => navigate('/achievements'),
//   },
//   {
//     key: 'settings',
//     icon: <SettingOutlined />,
//     label: 'Settings',
//     onClick: () => navigate('/settings'),
//   },
//   {
//     type: 'divider',
//     key: 'divider',
//   },
//   {
//     key: 'logout',
//     icon: <LogoutOutlined />,
//     label: 'Logout',
//     onClick: logout,
//   },
// ];

//   const menuItems = [
//     {
//       key: 'home',
//       icon: <HomeOutlined />,
//       label: <NavLink to="/">Home</NavLink>,
//     },
//     {
//       key: 'personalized',
//       icon: <StarOutlined />,
//       label: <NavLink to="/personalized">For You</NavLink>,
//     },
//     {
//       key: 'trending',
//       icon: <FireOutlined />,
//       label: <NavLink to="/trending">Trending</NavLink>,
//     },
//     {
//       key: 'categories',
//       keyPath: 'categories',
//       icon: <BookOutlined />,
//       label: 'Categories',
//       children: [
//         {
//           key: 'growth',
//           label: <NavLink to="/category/growth">Growth</NavLink>,
//         },
//         {
//           key: 'productivity',
//           label: <NavLink to="/category/productivity">Productivity</NavLink>,
//         },
//         {
//           key: 'career',
//           label: <NavLink to="/category/career">Career</NavLink>,
//         },
//         {
//           key: 'mindset',
//           label: <NavLink to="/category/mindset">Mindset</NavLink>,
//         },
//         {
//           key: 'relationships',
//           label: <NavLink to="/category/relationships">Relationships</NavLink>,
//         },
//         {
//           key: 'purpose',
//           label: <NavLink to="/category/purpose">Purpose</NavLink>,
//         },
//       ],
//     },
//     {
//       key: 'saved',
//       icon: <HeartOutlined />,
//       label: <NavLink to="/saved">Saved Articles</NavLink>,
//     },
//     {
//       key: 'history',
//       icon: <HistoryOutlined />,
//       label: <NavLink to="/history">Reading History</NavLink>,
//     },
//     {
//       key: 'premium',
//       icon: <CrownOutlined />,
//       label: <NavLink to="/premium">Premium</NavLink>,
//       style: { color: '#722ed1' },
//     },
//   ];

//   return (
//     <Layout style={{ minHeight: '100vh' }}>
//       {/* Mobile Header */}
//       <Header style={{
//         padding: '0 16px',
//         background: 'white',
//         borderBottom: '1px solid #f0f0f0',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         position: 'sticky',
//         top: 0,
//         zIndex: 100,
//       }}>
//         <Button
//           type="text"
//           icon={<MenuOutlined />}
//           onClick={() => setCollapsed(!collapsed)}
//           style={{ 
//             display: window.innerWidth < 992 ? 'block' : 'none' 
//           }}
//         />
        
//         <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//           <div style={{
//             width: 32,
//             height: 32,
//             background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
//             borderRadius: 8,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             color: 'white',
//             fontWeight: 'bold',
//             fontSize: '18px',
//           }}>
//             K
//           </div>
//           <Text strong style={{ fontSize: '18px' }}>
//             KnowledgeHub
//           </Text>
//         </NavLink>
        
//         <Space>
//           <Badge count={5}>
//             <Button type="text" icon={<BellOutlined />} />
//           </Badge>
          
//           <Button 
//             type="primary" 
//             icon={<PlusOutlined />}
//             onClick={() => navigate('/write')}
//           >
//             Write
//           </Button>
          
//           {user ? (
//             <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
//               <Avatar 
//                 src={user.picture} 
//                 style={{ cursor: 'pointer' }}
//               >
//                 {user.name?.charAt(0)}
//               </Avatar>
//             </Dropdown>
//           ) : (
//             <Button type="primary" onClick={() => navigate('/login')}>
//               Sign In
//             </Button>
//           )}
//         </Space>
//       </Header>

//       <Layout>
//         {/* Desktop Sidebar */}
//         <Sider
//           collapsible
//           collapsed={collapsed}
//           onCollapse={setCollapsed}
//           style={{
//             overflow: 'auto',
//             height: 'calc(100vh - 64px)',
//             position: 'sticky',
//             top: 64,
//             left: 0,
//             display: { xs: 'none', lg: 'block' },
//           }}
//           theme="light"
//         >
//           <div style={{ padding: '24px 16px' }}>
//             <Search
//               placeholder="Search articles..."
//               onSearch={(value) => navigate(`/search?q=${value}`)}
//               prefix={<SearchOutlined />}
//               style={{ marginBottom: 16 }}
//             />
//           </div>
          
//           <Menu
//             mode="inline"
//             defaultSelectedKeys={['home']}
//             items={menuItems}
//             style={{ borderRight: 0 }}
//           />
          
//           <div style={{ padding: '16px', marginTop: 'auto' }}>
//             <Button 
//               type="primary" 
//               block 
//               icon={<PlusOutlined />}
//               onClick={() => navigate('/write')}
//             >
//               {!collapsed && 'Write Article'}
//             </Button>
//           </div>
//         </Sider>

//         {/* Mobile Sidebar Drawer */}
//         <Drawer
//           title={
//             <Space>
//               <Avatar src={user?.picture} />
//               <Text strong>{user?.name || 'Welcome'}</Text>
//             </Space>
//           }
//           placement="left"
//           onClose={() => setCollapsed(false)}
//           open={collapsed}
//           width={280}
//           styles={{
//             body: { padding: 0 },
//           }}
//         >
//           <Search
//             placeholder="Search articles..."
//             onSearch={(value) => {
//               navigate(`/search?q=${value}`);
//               setCollapsed(false);
//             }}
//             prefix={<SearchOutlined />}
//             style={{ padding: '16px' }}
//           />
          
//           <Menu
//             mode="inline"
//             items={menuItems}
//             style={{ borderRight: 0 }}
//             onClick={() => setCollapsed(false)}
//           />
          
//           <div style={{ padding: '16px' }}>
//             <Button type="primary" block icon={<PlusOutlined />}>
//               Write Article
//             </Button>
//           </div>
//         </Drawer>

//         {/* Main Content */}
//         <Content style={{ 
//           padding: '24px', 
//           background: '#f5f5f5',
//           minHeight: 'calc(100vh - 64px)',
//         }}>
//           <Outlet />
//         </Content>
//       </Layout>
//     </Layout>
//   );
// };

// export default UserLayout;