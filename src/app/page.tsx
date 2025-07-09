'use client';

import { useState, useEffect, useCallback } from 'react';

interface Character {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  isPlayer: boolean;
  skills: Skill[];
}

interface Skill {
  name: string;
  emoji: string;
  damage: number;
  cost: number;
  description: string;
}

const PLAYER_CHARACTERS: Character[] = [
  {
    id: 'hero',
    name: 'นักสู้',
    emoji: '⚔️',
    hp: 100,
    maxHp: 100,
    attack: 25,
    defense: 10,
    speed: 15,
    isPlayer: true,
    skills: [
      { name: 'ฟันดาบ', emoji: '⚔️', damage: 30, cost: 10, description: 'โจมตีด้วยดาบ' },
      { name: 'ฟ้าผ่า', emoji: '⚡', damage: 45, cost: 20, description: 'โจมตีด้วยฟ้าผ่า' },
      { name: 'รักษา', emoji: '💚', damage: -30, cost: 15, description: 'ฟื้นฟูพลังชีวิต' }
    ]
  },
  {
    id: 'mage',
    name: 'นักเวทย์',
    emoji: '🧙‍♂️',
    hp: 80,
    maxHp: 80,
    attack: 35,
    defense: 5,
    speed: 12,
    isPlayer: true,
    skills: [
      { name: 'ลูกไฟ', emoji: '🔥', damage: 40, cost: 12, description: 'ปล่อยลูกไฟ' },
      { name: 'น้ำแข็ง', emoji: '❄️', damage: 35, cost: 10, description: 'โจมตีด้วยน้ำแข็ง' },
      { name: 'ดาวตก', emoji: '🌟', damage: 60, cost: 25, description: 'เรียกดาวตก' }
    ]
  },
  {
    id: 'archer',
    name: 'นักธนู',
    emoji: '🏹',
    hp: 90,
    maxHp: 90,
    attack: 30,
    defense: 8,
    speed: 18,
    isPlayer: true,
    skills: [
      { name: 'ยิงธนู', emoji: '🏹', damage: 35, cost: 8, description: 'ยิงธนูแม่นยำ' },
      { name: 'ฝนลูกศร', emoji: '🌧️', damage: 50, cost: 18, description: 'ยิงลูกศรหลายนัด' },
      { name: 'ลูกศรพิษ', emoji: '💀', damage: 45, cost: 15, description: 'ลูกศรที่มีพิษ' }
    ]
  }
];

const ENEMY_CHARACTERS: Character[] = [
  {
    id: 'goblin',
    name: 'ก็อบลิน',
    emoji: '👹',
    hp: 60,
    maxHp: 60,
    attack: 20,
    defense: 5,
    speed: 10,
    isPlayer: false,
    skills: [
      { name: 'กรงเล็บ', emoji: '🔪', damage: 25, cost: 5, description: 'ข่วนด้วยกรงเล็บ' },
      { name: 'ขว้างก้อนหิน', emoji: '🪨', damage: 20, cost: 3, description: 'ขว้างหิน' }
    ]
  },
  {
    id: 'orc',
    name: 'ออร์ค',
    emoji: '👺',
    hp: 80,
    maxHp: 80,
    attack: 30,
    defense: 8,
    speed: 8,
    isPlayer: false,
    skills: [
      { name: 'ตีด้วยค้อน', emoji: '🔨', damage: 35, cost: 8, description: 'ตีด้วยค้อนหนัก' },
      { name: 'เสียงคำราม', emoji: '💢', damage: 20, cost: 5, description: 'คำรามข่มขู่' }
    ]
  },
  {
    id: 'dragon',
    name: 'มังกร',
    emoji: '🐉',
    hp: 120,
    maxHp: 120,
    attack: 40,
    defense: 15,
    speed: 12,
    isPlayer: false,
    skills: [
      { name: 'ลมหายใจไฟ', emoji: '🔥', damage: 50, cost: 15, description: 'พ่นไฟจากปาก' },
      { name: 'กัดด้วยเขี้ยว', emoji: '🦷', damage: 45, cost: 12, description: 'กัดด้วยเขี้ยวแหลม' },
      { name: 'บินโฉบ', emoji: '🌪️', damage: 35, cost: 10, description: 'บินโฉบโจมตี' }
    ]
  }
];

export default function Home() {
  const [gameState, setGameState] = useState<'menu' | 'battle' | 'victory' | 'defeat'>('menu');
  const [playerTeam, setPlayerTeam] = useState<Character[]>([]);
  const [enemyTeam, setEnemyTeam] = useState<Character[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [turnOrder, setTurnOrder] = useState<Character[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Character | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [actionPhase, setActionPhase] = useState<'select' | 'target' | 'execute'>('select');
  const [currentStage, setCurrentStage] = useState(1);
  const [isFlashing, setIsFlashing] = useState(false);
  const [playerActionsUsed, setPlayerActionsUsed] = useState(0);
  const [enemyActionsUsed, setEnemyActionsUsed] = useState(0);

  const generateEnemiesForStage = (stage: number) => {
    const enemies = [];
    const numEnemies = Math.min(stage, 3); 
    
    for (let i = 0; i < numEnemies; i++) {
      const enemyTemplate = ENEMY_CHARACTERS[Math.floor(Math.random() * ENEMY_CHARACTERS.length)];
      const enhancedHp = enemyTemplate.maxHp + (stage - 1) * 10;
      enemies.push({
        ...enemyTemplate,
        id: `${enemyTemplate.id}_${i}`,
        maxHp: enhancedHp,
        hp: enhancedHp,
        attack: enemyTemplate.attack + Math.floor((stage - 1) * 2),
        defense: enemyTemplate.defense + Math.floor((stage - 1) * 1)
      });
    }
    
    return enemies;
  };

  const startGame = () => {
    const players = [...PLAYER_CHARACTERS];
    const enemies = generateEnemiesForStage(1);
    
    setPlayerTeam(players);
    setEnemyTeam(enemies);
    setCurrentStage(1);
    
    const allCharacters = [...players, ...enemies].sort((a, b) => b.speed - a.speed);
    setTurnOrder(allCharacters);
    setCurrentTurn(0);
    setGameState('battle');
    setBattleLog([`🎮 ด่านที่ 1 เริ่มต้น! (${enemies.length} ศัตรู)`]);
    setActionPhase('select');
    setPlayerActionsUsed(0);
    setEnemyActionsUsed(0);
  };

  const nextStage = useCallback(() => {
    const newStage = currentStage + 1;
    setCurrentStage(newStage);
    
    // สร้างศัตรูใหม่หลายตัวตามด่าน
    const enemies = generateEnemiesForStage(newStage);
    setEnemyTeam(enemies);
    
    // รีเซ็ตตำแหน่งในการต่อสู้
    const allCharacters = [...playerTeam, ...enemies].sort((a, b) => b.speed - a.speed);
    setTurnOrder(allCharacters);
    setCurrentTurn(0);
    setActionPhase('select');
    setPlayerActionsUsed(0);
    setEnemyActionsUsed(0);
    
    setBattleLog(prev => [...prev, `🎯 ด่านที่ ${newStage} เริ่มต้น! (${enemies.length} ศัตรู)`]);
  }, [currentStage, playerTeam]);

  const nextTurn = useCallback(() => {
    setCurrentTurn(prev => (prev + 1) % turnOrder.length);
    setSelectedSkill(null);
    setSelectedTarget(null);
    setActionPhase('select');
  }, [turnOrder.length]);

  const executeAction = useCallback((character: Character, skill: Skill, target: Character) => {
    const damage = Math.max(skill.damage - target.defense, 0);
    
    if (skill.damage < 0) {
      // เป็นสกิลรักษา
      const healAmount = Math.abs(skill.damage);
      character.hp = Math.min(character.hp + healAmount, character.maxHp);
      setBattleLog(prev => [...prev, `${character.emoji} ${character.name} ใช้ ${skill.emoji} ${skill.name} ฟื้นฟู ${healAmount} HP`]);
    } else {
      // เป็นสกิลโจมตี - แสดงเอฟเฟกต์กระพริบ
      target.hp = Math.max(target.hp - damage, 0);
      setBattleLog(prev => [...prev, `${character.emoji} ${character.name} ใช้ ${skill.emoji} ${skill.name} ใส่ ${target.emoji} ${target.name} สร้างความเสียหาย ${damage}!`]);
      
      // เอฟเฟกต์กระพริบ
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 300);
    }

    // เพิ่มจำนวนการกระทำ
    if (character.isPlayer) {
      setPlayerActionsUsed(prev => prev + 1);
    } else {
      setEnemyActionsUsed(prev => prev + 1);
    }

    // ตรวจสอบการชนะ/แพ้
    const aliveEnemies = enemyTeam.filter(e => e.hp > 0);
    const alivePlayers = playerTeam.filter(p => p.hp > 0);
    
    if (aliveEnemies.length === 0) {
      // ศัตรูตายหมด - ไปด่านต่อไป
      setTimeout(() => {
        nextStage();
      }, 1000);
      return;
    }
    
    if (alivePlayers.length === 0) {
      setGameState('defeat');
      setBattleLog(prev => [...prev, '💀 แพ้แล้ว!']);
      return;
    }

    // ตรวจสอบว่าแต่ละฝ่ายได้กระทำครบแล้วหรือไม่
    const totalPlayerActions = playerTeam.filter(p => p.hp > 0).length;
    const totalEnemyActions = enemyTeam.filter(e => e.hp > 0).length;
    
    if (character.isPlayer && playerActionsUsed + 1 >= totalPlayerActions) {
      // ฝ่ายผู้เล่นกระทำครบแล้ว ให้ศัตรูกระทำ
      setPlayerActionsUsed(0);
      setEnemyActionsUsed(0);
    } else if (!character.isPlayer && enemyActionsUsed + 1 >= totalEnemyActions) {
      // ฝ่ายศัตรูกระทำครบแล้ว ให้ผู้เล่นกระทำ
      setPlayerActionsUsed(0);
      setEnemyActionsUsed(0);
    }

    // เปลี่ยนเทิน
    nextTurn();
  }, [enemyTeam, playerTeam, nextTurn, playerActionsUsed, enemyActionsUsed, nextStage]);

  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkill(skill);
    setActionPhase('target');
  };

  const handleTargetSelect = (target: Character) => {
    setSelectedTarget(target);
    setActionPhase('execute');
  };

  const handleExecute = () => {
    if (selectedSkill && selectedTarget) {
      const alivePlayers = playerTeam.filter(p => p.hp > 0);
      const currentCharacter = alivePlayers[playerActionsUsed];
      if (currentCharacter) {
        executeAction(currentCharacter, selectedSkill, selectedTarget);
      }
    }
  };

  useEffect(() => {
    if (gameState === 'battle' && actionPhase === 'select') {
      const currentCharacter = turnOrder[currentTurn];
      
      if (!currentCharacter || !currentCharacter.isPlayer) {
        // ถ้าเป็นเทิร์นของศัตรูหรือไม่มีตัวละคร
        const aliveEnemies = enemyTeam.filter(e => e.hp > 0);
        if (aliveEnemies.length > 0 && enemyActionsUsed < aliveEnemies.length) {
          setTimeout(() => {
            const enemyToAct = aliveEnemies[enemyActionsUsed];
            const availableSkills = enemyToAct.skills;
            const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            
            const targets = randomSkill.damage < 0 ? 
              aliveEnemies : 
              playerTeam.filter(p => p.hp > 0);
            
            if (targets.length > 0) {
              const randomTarget = targets[Math.floor(Math.random() * targets.length)];
              executeAction(enemyToAct, randomSkill, randomTarget);
            }
          }, 1000);
        }
      }
    }
  }, [currentTurn, actionPhase, gameState, turnOrder, enemyTeam, playerTeam, executeAction, enemyActionsUsed]);

  const getCurrentCharacter = () => {
    if (isCurrentPlayerTurn()) {
      const alivePlayers = playerTeam.filter(p => p.hp > 0);
      return alivePlayers[playerActionsUsed] || null;
    }
    return null;
  };

  const isCurrentPlayerTurn = () => {
    const alivePlayers = playerTeam.filter(p => p.hp > 0);
    const aliveEnemies = enemyTeam.filter(e => e.hp > 0);
    
    // ถ้าผู้เล่นกระทำยังไม่ครบ ให้เป็นเทิร์นของผู้เล่น
    if (playerActionsUsed < alivePlayers.length) {
      return true;
    }
    
    // ถ้าผู้เล่นกระทำครบแล้ว และศัตรูกระทำครบแล้ว ให้เริ่มรอบใหม่
    if (enemyActionsUsed >= aliveEnemies.length) {
      return true;
    }
    
    return false;
  };

  const getAvailableTargets = () => {
    if (!selectedSkill) return [];
    
    if (selectedSkill.damage < 0) {
      // เป็นสกิลรักษา - เลือกเป้าหมายฝ่ายเดียวกัน
      return playerTeam.filter(p => p.hp > 0);
    } else {
      // เป็นสกิลโจมตี - เลือกเป้าหมายฝ่ายตรงข้าม
      return enemyTeam.filter(e => e.hp > 0);
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-8">⚔️ Emoji Quest ⚔️</h1>
          <p className="text-xl text-purple-200 mb-8">Turn-Based Emoji Battle Arena</p>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-300 transform hover:scale-105"
          >
            🎮 เริ่มเกม
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-8">🎉 ผ่านด่านแล้ว! 🎉</h1>
          <p className="text-xl text-green-200 mb-4">คุณได้ผ่านด่านที่ {currentStage} แล้ว!</p>
          <p className="text-lg text-green-300 mb-8">
            ด่านต่อไปจะมีศัตรู {Math.min(currentStage + 1, 3)} ตัว
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setGameState('battle');
                nextStage();
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-300 transform hover:scale-105"
            >
              ➡️ ด่านต่อไป
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-300 transform hover:scale-105"
            >
              🏠 กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'defeat') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-rose-900 to-pink-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-8">💀 แพ้แล้ว! 💀</h1>
          <p className="text-xl text-red-200 mb-8">ลองใหม่อีกครั้ง!</p>
          <button
            onClick={() => setGameState('menu')}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-300 transform hover:scale-105"
          >
            🏠 กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-4 transition-all duration-300 ${
      isFlashing ? 'bg-white bg-opacity-30' : ''
    }`}>
      <style jsx>{`
        .glow-effect {
          box-shadow: 0 0 20px rgba(255, 255, 0, 0.5), 0 0 40px rgba(255, 255, 0, 0.3);
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 20px rgba(255, 255, 0, 0.5), 0 0 40px rgba(255, 255, 0, 0.3); }
          50% { box-shadow: 0 0 25px rgba(255, 255, 0, 0.7), 0 0 50px rgba(255, 255, 0, 0.4); }
          100% { box-shadow: 0 0 20px rgba(255, 255, 0, 0.5), 0 0 40px rgba(255, 255, 0, 0.3); }
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h1 className="text-3xl font-bold text-white text-center">⚔️ Battle Arena ⚔️</h1>
          <div className="text-center mt-2">
            <span className="text-yellow-400">ด่านที่ {currentStage}</span>
            <span className="text-gray-400 mx-2">|</span>
            <span className="text-yellow-400">เทิน: {getCurrentCharacter()?.emoji} {getCurrentCharacter()?.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Player Team */}
          <div className="bg-blue-900 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">🛡️ ทีมผู้เล่น ({playerTeam.filter(p => p.hp > 0).length}/{playerTeam.length})</h2>
            <div className="space-y-3">
              {playerTeam.map((character, index) => (
                <div
                  key={character.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTarget === character
                      ? 'border-green-400 bg-green-800'
                      : character.hp === 0
                      ? 'border-red-400 bg-red-800 opacity-50'
                      : index === playerActionsUsed && isCurrentPlayerTurn() 
                      ? 'border-yellow-400 bg-yellow-800 glow-effect'
                      : 'border-blue-400 bg-blue-800 hover:bg-blue-700'
                  }`}
                  onClick={() => {
                    if (actionPhase === 'target' && getAvailableTargets().includes(character)) {
                      handleTargetSelect(character);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{character.emoji}</span>
                      <span className="text-white font-semibold">{character.name}</span>
                      {index === playerActionsUsed && isCurrentPlayerTurn() && (
                        <span className="ml-2 text-yellow-400 text-sm">🎯 เทิร์น</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">HP: {character.hp}/{character.maxHp}</div>
                      <div className="w-20 bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Battle Actions */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">🎯 การกระทำ</h2>
            
            {isCurrentPlayerTurn() && actionPhase === 'select' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg text-white">เลือกสกิล:</h3>
                  <div className="text-sm text-gray-400">
                    เหลือ: {playerTeam.filter(p => p.hp > 0).length - playerActionsUsed} การกระทำ
                  </div>
                </div>
                {playerTeam.filter(p => p.hp > 0)[playerActionsUsed]?.skills.map((skill, index) => (
                  <button
                    key={index}
                    onClick={() => handleSkillSelect(skill)}
                    className="w-full p-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{skill.emoji}</span>
                        <span className="font-semibold">{skill.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">DMG: {skill.damage}</div>
                        <div className="text-xs text-purple-200">Cost: {skill.cost}</div>
                      </div>
                    </div>
                    <div className="text-xs text-purple-200 mt-1">{skill.description}</div>
                  </button>
                ))}
              </div>
            )}

            {isCurrentPlayerTurn() && actionPhase === 'target' && (
              <div className="space-y-3">
                <h3 className="text-lg text-white">เลือกเป้าหมาย:</h3>
                <div className="bg-purple-800 p-3 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{selectedSkill?.emoji}</span>
                    <span className="text-white font-semibold">{selectedSkill?.name}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">คลิกที่ตัวละครที่ต้องการจะใช้สกิล</p>
                <button
                  onClick={() => setActionPhase('select')}
                  className="w-full p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                >
                  ยกเลิก
                </button>
              </div>
            )}

            {isCurrentPlayerTurn() && actionPhase === 'execute' && (
              <div className="space-y-3">
                <h3 className="text-lg text-white">ยืนยันการกระทำ:</h3>
                <div className="bg-purple-800 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">{selectedSkill?.emoji}</span>
                    <span className="text-white font-semibold">{selectedSkill?.name}</span>
                  </div>
                  <div className="text-sm text-purple-200">
                    เป้าหมาย: {selectedTarget?.emoji} {selectedTarget?.name}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExecute}
                    className="flex-1 p-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold"
                  >
                    ✅ ยืนยัน
                  </button>
                  <button
                    onClick={() => setActionPhase('select')}
                    className="flex-1 p-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold"
                  >
                    ❌ ยกเลิก
                  </button>
                </div>
              </div>
            )}

            {!isCurrentPlayerTurn() && (
              <div className="text-center text-gray-400">
                <div className="text-2xl mb-2">⏳</div>
                <div>รอศัตรูเล่น...</div>
                <div className="text-sm mt-1">
                  ศัตรูกระทำแล้ว: {enemyActionsUsed}/{enemyTeam.filter(e => e.hp > 0).length}
                </div>
              </div>
            )}
          </div>

          {/* Enemy Team */}
          <div className="bg-red-900 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">👹 ศัตรู ({enemyTeam.filter(e => e.hp > 0).length}/{enemyTeam.length})</h2>
            <div className="space-y-3">
              {enemyTeam.map((character) => (
                <div
                  key={character.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTarget === character
                      ? 'border-green-400 bg-green-800'
                      : character.hp === 0
                      ? 'border-gray-400 bg-gray-800 opacity-50'
                      : 'border-red-400 bg-red-800 hover:bg-red-700'
                  }`}
                  onClick={() => {
                    if (actionPhase === 'target' && getAvailableTargets().includes(character)) {
                      handleTargetSelect(character);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{character.emoji}</span>
                      <span className="text-white font-semibold">{character.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">HP: {character.hp}/{character.maxHp}</div>
                      <div className="w-20 bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <h2 className="text-xl font-bold text-white mb-4">📜 บันทึกการต่อสู้</h2>
          <div className="bg-black rounded-lg p-4 h-40 overflow-y-auto">
            {battleLog.map((log, index) => (
              <div key={index} className="text-green-400 text-sm mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
