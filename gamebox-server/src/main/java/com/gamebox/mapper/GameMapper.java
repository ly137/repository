package com.gamebox.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gamebox.entity.Game;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface GameMapper extends BaseMapper<Game> {
}
