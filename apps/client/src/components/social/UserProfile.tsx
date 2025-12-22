// // components/social/UserProfile.tsx
// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Row,
//   Col,
//   Typography,
//   Space,
//   Button,
//   Avatar,
//   Tabs,
//   Tag,
//   Statistic,
//   List,
//   Divider,
//   Input,
//   message,
//   Modal,
//   Badge,
//   Progress,
//   Tooltip
// } from 'antd';
// import {
//   UserOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   MailOutlined,
//   LinkOutlined,
//   CalendarOutlined,
//   EnvironmentOutlined,
//   GlobalOutlined,
//   TrophyOutlined,
//   BookOutlined,
//   HeartOutlined,
//   CommentOutlined,
//   TeamOutlined,
//   PlusOutlined,
//   CheckOutlined,
//   SendOutlined,
//   SettingOutlined,
//   CrownOutlined,
//   FireOutlined
// } from '@ant-design/icons';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   getUserProfile,
//   followUser,
//   unfollowUser,
//   getUserArticles,
//   getUserStats,
//   sendMessage,
//   updateProfile
// } from '../../services/api';
// import { use } from '../../stores/authStore';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { TabPane } = Tabs;

// interface UserProfile {
//   id: string;
//   username: string;
//   name: string;
//   email: string;
//   picture?: string;
//   bio?: string;
//   location?: string;
//   website?: string;
//   joinDate: string;
//   role: 'user' | 'writer' | 'expert' | 'admin';
//   badges: Array<{
//     id: string;
//     name: string;
//     icon: string;
//     description: string;
//   }>;
//   stats: {
//     articles: number;
//     followers: number;
//     following: number;
//     totalViews: number;
//     totalLikes: number;
//     readingStreak: number;
//     level: number;
//     exp: number;
//   };
//   isFollowing: boolean;
//   isCurrentUser: boolean;
// }

// interface Article {
//   id: string;
//   title: string;
//   excerpt: string;
//   slug: string;
//   views: number;
//   likes: number;
//   comments: number;
//   publishedAt: string;
//   isFeatured: boolean;
// }

// const UserProfile: React.FC = () => {
//   const { username } = useParams<{ username: string }>();
//   const navigate = useNavigate();
//   const { user: currentUser } = useAuth();
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [articles, setArticles] = useState<Article[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState('articles');
//   const [messageModalVisible, setMessageModalVisible] = useState(false);
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [message, setMessage] = useState('');
//   const [editData, setEditData] = useState({
//     bio: '',
//     location: '',
//     website: '',
//   });

//   useEffect(() => {
//     if (username) {
//       fetchProfile();
//       fetchArticles();
//     }
//   }, [username]);

//   const fetchProfile = async () => {
//     setLoading(true);
//     try {
//       const data = await getUserProfile(username!);
//       setProfile(data);
//       setEditData({
//         bio: data.bio || '',
//         location: data.location || '',
//         website: data.website || '',
//       });
//     } catch (error) {
//       message.error('Failed to load profile');
//       navigate('/');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchArticles = async () => {
//     try {
//       const data = await getUserArticles(username!);
//       setArticles(data);
//     } catch (error) {
//       console.error('Failed to load user articles:', error);
//     }
//   };

//   const handleFollow = async () => {
//     if (!profile) return;

//     try {
//       if (profile.isFollowing) {
//         await unfollowUser(profile.id);
//         setProfile(prev => prev ? {
//           ...prev,
//           isFollowing: false,
//           stats: {
//             ...prev.stats,
//             followers: prev.stats.followers - 1
//           }
//         } : null);
//         message.success(`Unfollowed ${profile.name}`);
//       } else {
//         await followUser(profile.id);
//         setProfile(prev => prev ? {
//           ...prev,
//           isFollowing: true,
//           stats: {
//             ...prev.stats,
//             followers: prev.stats.followers + 1
//           }
//         } : null);
//         message.success(`Following ${profile.name}`);
//       }
//     } catch (error) {
//       message.error('Failed to update follow status');
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!profile || !message.trim()) return;

//     try {
//       await sendMessage(profile.id, message);
//       message.success('Message sent successfully');
//       setMessage('');
//       setMessageModalVisible(false);
//     } catch (error) {
//       message.error('Failed to send message');
//     }
//   };

//   const handleSaveProfile = async () => {
//     if (!profile) return;

//     try {
//       await updateProfile(editData);
//       setProfile(prev => prev ? { ...prev, ...editData } : null);
//       message.success('Profile updated successfully');
//       setEditModalVisible(false);
//     } catch (error) {
//       message.error('Failed to update profile');
//     }
//   };

//   const getRoleColor = (role: string) => {
//     switch (role) {
//       case 'writer': return '#1890ff';
//       case 'expert': return '#52c41a';
//       case 'admin': return '#f5222d';
//       default: return '#8c8c8c';
//     }
//   };

//   const getRoleIcon = (role: string) => {
//     switch (role) {
//       case 'writer': return <BookOutlined />;
//       case 'expert': return <TrophyOutlined />;
//       case 'admin': return <CrownOutlined />;
//       default: return <UserOutlined />;
//     }
//   };

//   const statCards = [
//     {
//       title: 'Articles',
//       value: profile?.stats.articles || 0,
//       icon: <BookOutlined />,
//       color: '#1890ff',
//     },
//     {
//       title: 'Followers',
//       value: profile?.stats.followers || 0,
//       icon: <TeamOutlined />,
//       color: '#52c41a',
//     },
//     {
//       title: 'Total Views',
//       value: profile?.stats.totalViews.toLocaleString() || '0',
//       icon: <FireOutlined />,
//       color: '#fa8c16',
//     },
//     {
//       title: 'Reading Streak',
//       value: profile?.stats.readingStreak || 0,
//       icon: <FireOutlined />,
//       color: '#f5222d',
//       suffix: 'days',
//     },
//   ];

//   if (loading || !profile) {
//     return <Card loading />;
//   }

//   return (
//     <div>
//       {/* Profile Header */}
//       <Card style={{ marginBottom: 24 }}>
//         <Row gutter={[24, 24]}>
//           <Col xs={24} md={6}>
//             <div style={{ textAlign: 'center' }}>
//               <Badge
//                 count={
//                   <Avatar
//                     size={64}
//                     src={profile.picture}
//                     style={{ border: '4px solid white' }}
//                   >
//                     {profile.name.charAt(0)}
//                   </Avatar>
//                 }
//                 offset={[-10, 80]}
//                 style={{ backgroundColor: 'transparent' }}
//               >
//                 <Avatar
//                   size={120}
//                   src={profile.picture}
//                   style={{
//                     border: `4px solid ${getRoleColor(profile.role)}`,
//                   }}
//                 >
//                   {profile.name.charAt(0)}
//                 </Avatar>
//               </Badge>

//               {/* Level Badge */}
//               <div
//                 style={{
//                   position: 'relative',
//                   display: 'inline-block',
//                   marginTop: -24,
//                 }}
//               >
//                 <div
//                   style={{
//                     backgroundColor: getRoleColor(profile.role),
//                     color: 'white',
//                     padding: '4px 12px',
//                     borderRadius: '12px',
//                     fontSize: '12px',
//                     fontWeight: 'bold',
//                   }}
//                 >
//                   Level {profile.stats.level}
//                 </div>
//                 <Progress
//                   percent={(profile.stats.exp % 100)}
//                   size="small"
//                   showInfo={false}
//                   strokeColor="#52c41a"
//                   style={{
//                     position: 'absolute',
//                     bottom: -4,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               </div>
//             </div>
//           </Col>

//           <Col xs={24} md={12}>
//             <Space direction="vertical" size="small" style={{ width: '100%' }}>
//               <Space align="center">
//                 <Title level={2} style={{ margin: 0 }}>
//                   {profile.name}
//                 </Title>
//                 <Tag color={getRoleColor(profile.role)} icon={getRoleIcon(profile.role)}>
//                   {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
//                 </Tag>
//               </Space>

//               <Text type="secondary" style={{ fontSize: '16px' }}>
//                 @{profile.username}
//               </Text>

//               {profile.bio && (
//                 <Paragraph style={{ margin: '12px 0' }}>
//                   {profile.bio}
//                 </Paragraph>
//               )}

//               <Space wrap>
//                 {profile.location && (
//                   <Text type="secondary">
//                     <EnvironmentOutlined /> {profile.location}
//                   </Text>
//                 )}
//                 {profile.website && (
//                   <a href={profile.website} target="_blank" rel="noopener noreferrer">
//                     <LinkOutlined /> Website
//                   </a>
//                 )}
//                 <Text type="secondary">
//                   <CalendarOutlined /> Joined {new Date(profile.joinDate).toLocaleDateString()}
//                 </Text>
//               </Space>

//               {/* Badges */}
//               {profile.badges.length > 0 && (
//                 <Space wrap style={{ marginTop: 8 }}>
//                   {profile.badges.map(badge => (
//                     <Tooltip key={badge.id} title={badge.description}>
//                       <Tag
//                         icon={<img src={badge.icon} alt={badge.name} style={{ width: 12, height: 12 }} />}
//                         style={{ cursor: 'pointer' }}
//                       >
//                         {badge.name}
//                       </Tag>
//                     </Tooltip>
//                   ))}
//                 </Space>
//               )}
//             </Space>
//           </Col>

//           <Col xs={24} md={6}>
//             <Space direction="vertical" size="middle" style={{ width: '100%' }}>
//               <Row gutter={[12, 12]}>
//                 {statCards.map((stat, index) => (
//                   <Col span={12} key={index}>
//                     <Card size="small" bodyStyle={{ padding: 8 }}>
//                       <Statistic
//                         title={stat.title}
//                         value={stat.value}
//                         prefix={stat.icon}
//                         suffix={stat.suffix}
//                         valueStyle={{ 
//                           color: stat.color,
//                           fontSize: '18px',
//                         }}
//                       />
//                     </Card>
//                   </Col>
//                 ))}
//               </Row>

//               <Space style={{ width: '100%' }}>
//                 {profile.isCurrentUser ? (
//                   <>
//                     <Button
//                       icon={<EditOutlined />}
//                       onClick={() => setEditModalVisible(true)}
//                       block
//                     >
//                       Edit Profile
//                     </Button>
//                     <Button
//                       icon={<SettingOutlined />}
//                       onClick={() => navigate('/settings')}
//                     />
//                   </>
//                 ) : (
//                   <>
//                     <Button
//                       type={profile.isFollowing ? 'default' : 'primary'}
//                       icon={profile.isFollowing ? <CheckOutlined /> : <PlusOutlined />}
//                       onClick={handleFollow}
//                       block
//                     >
//                       {profile.isFollowing ? 'Following' : 'Follow'}
//                     </Button>
//                     <Button
//                       icon={<MailOutlined />}
//                       onClick={() => setMessageModalVisible(true)}
//                     />
//                   </>
//                 )}
//                 <Button
//                   icon={<ShareAltOutlined />}
//                   onClick={() => {
//                     navigator.clipboard.writeText(window.location.href);
//                     message.success('Profile link copied!');
//                   }}
//                 />
//               </Space>
//             </Space>
//           </Col>
//         </Row>
//       </Card>

//       {/* Tabs Section */}
//       <Tabs activeKey={activeTab} onChange={setActiveTab}>
//         <TabPane
//           tab={
//             <Space>
//               <BookOutlined />
//               <span>Articles ({articles.length})</span>
//             </Space>
//           }
//           key="articles"
//         >
//           <List
//             dataSource={articles}
//             renderItem={article => (
//               <List.Item
//                 actions={[
//                   <Space key="views">
//                     <EyeOutlined />
//                     <span>{article.views.toLocaleString()}</span>
//                   </Space>,
//                   <Space key="likes">
//                     <HeartOutlined />
//                     <span>{article.likes}</span>
//                   </Space>,
//                   <Space key="comments">
//                     <CommentOutlined />
//                     <span>{article.comments}</span>
//                   </Space>,
//                 ]}
//                 style={{ padding: '16px 0' }}
//               >
//                 <List.Item.Meta
//                   title={
//                     <a href={`/article/${article.slug}`} onClick={(e) => {
//                       e.preventDefault();
//                       navigate(`/article/${article.slug}`);
//                     }}>
//                       {article.title}
//                       {article.isFeatured && (
//                         <Tag color="gold" style={{ marginLeft: 8 }}>Featured</Tag>
//                       )}
//                     </a>
//                   }
//                   description={
//                     <Space direction="vertical" size={2}>
//                       <Paragraph type="secondary" style={{ margin: 0 }}>
//                         {article.excerpt}
//                       </Paragraph>
//                       <Text type="secondary" style={{ fontSize: '12px' }}>
//                         Published {new Date(article.publishedAt).toLocaleDateString()}
//                       </Text>
//                     </Space>
//                   }
//                 />
//               </List.Item>
//             )}
//           />
//         </TabPane>

//         <TabPane
//           tab={
//             <Space>
//               <TrophyOutlined />
//               <span>Achievements</span>
//             </Space>
//           }
//           key="achievements"
//         >
//           <AchievementSystem showUnlockedOnly compact={false} />
//         </TabPane>

//         <TabPane
//           tab={
//             <Space>
//               <TeamOutlined />
//               <span>Followers ({profile.stats.followers})</span>
//             </Space>
//           }
//           key="followers"
//         >
//           <UserFollowersList userId={profile.id} />
//         </TabPane>

//         <TabPane
//           tab={
//             <Space>
//               <TeamOutlined />
//               <span>Following ({profile.stats.following})</span>
//             </Space>
//           }
//           key="following"
//         >
//           <UserFollowingList userId={profile.id} />
//         </TabPane>
//       </Tabs>

//       {/* Send Message Modal */}
//       <Modal
//         title={`Message ${profile.name}`}
//         open={messageModalVisible}
//         onCancel={() => setMessageModalVisible(false)}
//         onOk={handleSendMessage}
//         okText="Send Message"
//       >
//         <TextArea
//           placeholder={`Write a message to ${profile.name}...`}
//           rows={4}
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           maxLength={500}
//           showCount
//         />
//       </Modal>

//       {/* Edit Profile Modal */}
//       <Modal
//         title="Edit Profile"
//         open={editModalVisible}
//         onCancel={() => setEditModalVisible(false)}
//         onOk={handleSaveProfile}
//         width={600}
//       >
//         <Space direction="vertical" size="middle" style={{ width: '100%' }}>
//           <div>
//             <Text strong style={{ display: 'block', marginBottom: 8 }}>Bio</Text>
//             <TextArea
//               placeholder="Tell others about yourself..."
//               rows={4}
//               value={editData.bio}
//               onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
//               maxLength={200}
//               showCount
//             />
//           </div>

//           <div>
//             <Text strong style={{ display: 'block', marginBottom: 8 }}>Location</Text>
//             <Input
//               placeholder="City, Country"
//               value={editData.location}
//               onChange={(e) => setEditData({ ...editData, location: e.target.value })}
//               prefix={<EnvironmentOutlined />}
//             />
//           </div>

//           <div>
//             <Text strong style={{ display: 'block', marginBottom: 8 }}>Website</Text>
//             <Input
//               placeholder="https://example.com"
//               value={editData.website}
//               onChange={(e) => setEditData({ ...editData, website: e.target.value })}
//               prefix={<GlobalOutlined />}
//             />
//           </div>
//         </Space>
//       </Modal>
//     </div>
//   );
// };

// export default UserProfile;